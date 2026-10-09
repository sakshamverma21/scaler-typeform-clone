"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  CalendarDays,
  FilePlus2,
  FileText,
  LayoutGrid,
  List,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Search,
  X,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNotify } from "@/components/ui/notifications";
import { ConnectionStatus } from "@/features/foundation/connection-status";
import { ApiError } from "@/lib/api/client";
import { creatorApi, type FormMetadata } from "@/lib/api/forms";
import { FormActions, type FormAction } from "./form-actions";
import { useCreatorSession, WorkspaceError, WorkspaceLoading } from "./session";

type DialogState =
  { kind: "create" } | { kind: "rename" | "delete"; form: FormMetadata };
type Operation =
  | { kind: "create"; title: string }
  | { kind: "rename"; form: FormMetadata; title: string }
  | { kind: "duplicate" | "delete"; form: FormMetadata };

const preferenceKey = "typeform:workspace-view";
let fallbackView: "list" | "grid" = "list";
function preferredView(): "list" | "grid" {
  try {
    return localStorage.getItem(preferenceKey) === "grid" ? "grid" : "list";
  } catch {
    return fallbackView;
  }
}
function subscribeView(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("workspace-view", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("workspace-view", listener);
  };
}
const serverView = () => "list" as const;

function FormMark({ title }: { title: string }) {
  const event = title.includes("Event registration");
  const feedback = title.includes("Product feedback");
  const Icon = event ? CalendarDays : feedback ? MessageSquareText : FileText;
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${event ? "bg-[#e4f0e9] text-[#496b58]" : feedback ? "bg-[#f0e6f7] text-[#7f5b91]" : "bg-[#f6ece0] text-[#94724e]"}`}
    >
      <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}

function Status({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] ${published ? "bg-[#eaf3ed] text-[#326145]" : "bg-surface-muted text-text-muted"}`}
    >
      <span
        className={`size-1.5 rounded-full ${published ? "bg-[#54876a]" : "bg-[#a3a39d]"}`}
        aria-hidden="true"
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

const updatedDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

export function Dashboard() {
  const router = useRouter();
  const cache = useQueryClient();
  const notify = useNotify();
  const session = useCreatorSession();
  const workspaceId = session.data?.workspace_id;
  const forms = useInfiniteQuery({
    queryKey: ["creator", "forms", workspaceId],
    queryFn: ({ pageParam }) =>
      creatorApi.forms({ cursor: pageParam, limit: 30 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: !!workspaceId,
    retry: false,
  });
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [error, setError] = useState<string | null>(null);
  const view = useSyncExternalStore(subscribeView, preferredView, serverView);
  const createButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  const operation = useMutation({
    mutationFn: async (action: Operation) => {
      if (action.kind === "create")
        return creatorApi.create({ title: action.title });
      if (action.kind === "rename")
        return creatorApi.rename(
          action.form.id,
          action.title,
          action.form.draft_revision,
        );
      if (action.kind === "duplicate") {
        const latest = await creatorApi.form(action.form.id);
        return creatorApi.duplicate(action.form.id, latest.form.draft_revision);
      }
      return creatorApi.delete(action.form.id);
    },
    onSuccess: (result, action) => {
      setDialog(null);
      setError(null);
      void cache.invalidateQueries({
        queryKey: ["creator", "forms", workspaceId],
      });
      if ("form" in result)
        cache.setQueryData(
          ["creator", "form", workspaceId, result.form.id],
          result,
        );
      if (action.kind === "delete")
        cache.removeQueries({
          queryKey: ["creator", "form", workspaceId, action.form.id],
        });
      notify(
        action.kind === "create"
          ? "Form created"
          : action.kind === "rename"
            ? "Form renamed"
            : action.kind === "duplicate"
              ? "Form duplicated — your original is unchanged"
              : "Form and its responses deleted",
      );
      if (action.kind === "create" && "form" in result)
        router.push(`/forms/${result.form.id}/build`);
    },
    onError: async (failure, action) => {
      if (session.recover(failure)) {
        setDialog(null);
        setError(null);
        notify("Your session expired. A new demo workspace is opening.");
        return;
      }
      if (failure instanceof ApiError && failure.status === 412) {
        void cache.invalidateQueries({
          queryKey: ["creator", "forms", workspaceId],
        });
        if (action.kind === "rename") {
          try {
            const latest = await creatorApi.form(action.form.id);
            setDialog((current) =>
              current?.kind === "rename"
                ? { ...current, form: latest.form }
                : current,
            );
            setError(
              "This form changed elsewhere. Its latest version is loaded; review the name and save again.",
            );
            return;
          } catch {
            /* Keep edits available if refreshing also fails. */
          }
        }
      }
      setError(failure.message);
    },
  });
  const allForms = forms.data?.pages.flatMap((page) => page.items) ?? [];
  const filtered = allForms
    .filter((form) =>
      form.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : sort === "created"
          ? b.created_at.localeCompare(a.created_at)
          : b.updated_at.localeCompare(a.updated_at),
    );
  const busy = operation.isPending;

  function openCreate() {
    returnFocus.current = createButton.current;
    setName("");
    setError(null);
    setDialog({ kind: "create" });
  }
  function onAction(
    action: FormAction,
    form: FormMetadata,
    trigger: HTMLButtonElement,
  ) {
    returnFocus.current = trigger;
    setError(null);
    if (action === "duplicate") operation.mutate({ kind: "duplicate", form });
    else {
      setName(form.title);
      setDialog({ kind: action, form });
    }
  }
  function setView(next: "list" | "grid") {
    fallbackView = next;
    try {
      localStorage.setItem(preferenceKey, next);
    } catch {
      /* Preference storage is optional. */
    }
    window.dispatchEvent(new Event("workspace-view"));
  }

  return (
    <WorkspaceShell>
      <div className="p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">My forms</h1>
            <p className="mt-2 text-sm text-text-muted">
              {session.data?.workspace_name ?? "My workspace"}
              <span className="mx-2 text-border" aria-hidden="true">
                /
              </span>
              Private to this browser
            </p>
          </div>
          <Button
            ref={createButton}
            onClick={openCreate}
            disabled={!workspaceId || busy}
          >
            <Plus size={16} aria-hidden="true" />
            Create a form
          </Button>
        </div>
        {session.isPending ? (
          <WorkspaceLoading />
        ) : session.isError ? (
          <WorkspaceError
            message={session.error.message}
            retry={() => {
              void session.refetch();
            }}
            busy={session.isFetching}
          />
        ) : forms.isPending ? (
          <WorkspaceLoading />
        ) : forms.isError && !forms.data ? (
          <WorkspaceError
            message={forms.error.message}
            retry={() => {
              if (!session.recover(forms.error)) void forms.refetch();
            }}
            busy={forms.isFetching}
          />
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
              <label className="relative flex min-w-0 basis-full items-center sm:max-w-xs sm:flex-1 sm:basis-auto">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  aria-label="Search forms"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search forms"
                  className="min-h-10 w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm outline-offset-2"
                />
              </label>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Sort forms"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="min-h-10 rounded-lg border border-border bg-surface px-3 text-xs"
                >
                  <option value="updated">Last updated</option>
                  <option value="created">Date created</option>
                  <option value="name">Name</option>
                </select>
                <div
                  className="flex rounded-lg border border-border bg-surface p-1"
                  aria-label="Form view"
                >
                  <button
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                    className={`flex size-8 items-center justify-center rounded-md ${view === "list" ? "bg-surface-muted" : "text-text-muted"}`}
                  >
                    <List size={16} />
                  </button>
                  <button
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                    onClick={() => setView("grid")}
                    className={`flex size-8 items-center justify-center rounded-md ${view === "grid" ? "bg-surface-muted" : "text-text-muted"}`}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              </div>
            </div>
            {allForms.some(
              (form) =>
                form.seed_response_count > 0 ||
                form.title.startsWith("Sample:"),
            ) && (
              <p className="my-5 text-xs leading-5 text-text-muted">
                Start with a sample, or make something your own. Sample forms
                and responses use synthetic data.
              </p>
            )}
            {error && !dialog && (
              <div
                role="alert"
                className="my-4 flex items-start justify-between gap-3 rounded-lg border border-[#edc5c0] bg-[#fff4f2] p-3 text-sm text-[var(--danger)]"
              >
                <span>{error}</span>
                <button
                  aria-label="Dismiss error"
                  onClick={() => setError(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {forms.isError && forms.data && (
              <div
                role="alert"
                className="my-3 flex flex-wrap items-center gap-3 text-sm text-[var(--danger)]"
              >
                Couldn’t refresh forms. Your previous list is still shown.
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!session.recover(forms.error)) void forms.refetch();
                  }}
                >
                  Retry
                </Button>
              </div>
            )}
            {allForms.length === 0 ? (
              <section className="my-8 flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-canvas px-6 py-12 text-center">
                <span className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-border bg-surface">
                  <FilePlus2
                    size={28}
                    strokeWidth={1.3}
                    className="text-text-muted"
                    aria-hidden="true"
                  />
                </span>
                <h2 className="text-xl font-medium">
                  Your next idea starts here
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-text-muted">
                  Create your first form and turn your questions into
                  conversations.
                </p>
                <Button className="mt-6" onClick={openCreate}>
                  <Plus size={16} aria-hidden="true" />
                  Create your first form
                </Button>
              </section>
            ) : filtered.length === 0 ? (
              <div className="my-8 rounded-xl border border-dashed border-border py-16 text-center">
                <h2 className="font-medium">No forms match your search</h2>
                <Button
                  variant="ghost"
                  className="mt-3"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <>
                {view === "list" && (
                  <div
                    aria-hidden="true"
                    className="mb-2 hidden grid-cols-[minmax(0,1fr)_100px_100px_120px_40px] items-center gap-4 px-5 text-xs text-text-muted xl:grid"
                  >
                    <span>
                      {filtered.length}{" "}
                      {filtered.length === 1 ? "form" : "forms"}
                    </span>
                    <span>Status</span>
                    <span>Responses</span>
                    <span>Updated</span>
                    <span />
                  </div>
                )}
                <ul
                  aria-label="Forms"
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3"
                      : "space-y-2"
                  }
                >
                  {filtered.map((form) => (
                    <li
                      key={form.id}
                      data-testid="form-card"
                      className={`group rounded-xl border border-border bg-surface transition-shadow hover:shadow-sm ${view === "grid" ? "flex min-h-52 flex-col p-5" : "grid grid-cols-[minmax(0,1fr)_40px] items-center gap-4 px-4 py-3 xl:grid-cols-[minmax(0,1fr)_100px_100px_120px_40px] xl:px-5"}`}
                    >
                      <div
                        className={`flex min-w-0 items-start gap-3 ${view === "grid" ? "flex-1" : "items-center"}`}
                      >
                        <FormMark title={form.title} />
                        <div className="min-w-0">
                          <Link
                            href={`/forms/${form.id}/build`}
                            title={form.title}
                            className={`block font-medium outline-offset-4 hover:underline ${view === "grid" ? "line-clamp-2 leading-6" : "truncate"}`}
                          >
                            {form.title}
                          </Link>
                          {view === "list" && (
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted xl:hidden">
                              <Status published={form.is_published} />
                              <span>
                                {form.response_count} responses
                                {form.seed_response_count > 0
                                  ? ` · ${form.seed_response_count} sample`
                                  : ""}
                              </span>
                            </div>
                          )}
                        </div>
                        {view === "grid" && (
                          <FormActions
                            form={form}
                            disabled={busy}
                            onAction={onAction}
                          />
                        )}
                      </div>
                      {view === "grid" ? (
                        <div className="mt-6 flex items-center justify-between gap-2">
                          <Status published={form.is_published} />
                          <span className="text-xs text-text-muted">
                            {form.response_count} responses
                            {form.seed_response_count > 0 && (
                              <span className="ml-1">· sample</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="hidden xl:block">
                            <Status published={form.is_published} />
                          </div>
                          <div className="hidden text-sm xl:block">
                            {form.response_count}
                            {form.seed_response_count > 0 && (
                              <span className="mt-1 block text-[10px] text-text-muted">
                                {form.seed_response_count} sample
                              </span>
                            )}
                          </div>
                          <time
                            dateTime={form.updated_at}
                            className="hidden text-xs text-text-muted xl:block"
                          >
                            {updatedDate(form.updated_at)}
                          </time>
                          <FormActions
                            form={form}
                            disabled={busy}
                            onAction={onAction}
                          />
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {forms.hasNextPage && (
              <div className="mt-6 text-center">
                {search && (
                  <p className="mb-2 text-xs text-text-muted">
                    Search covers loaded forms. Load more to include the rest.
                  </p>
                )}
                <Button
                  variant="secondary"
                  disabled={forms.isFetchingNextPage}
                  onClick={() => {
                    void forms.fetchNextPage();
                  }}
                >
                  {forms.isFetchingNextPage && (
                    <LoaderCircle size={14} className="animate-spin" />
                  )}
                  Load more forms
                </Button>
              </div>
            )}
          </>
        )}
        <div className="mt-8">
          <ConnectionStatus />
        </div>
        <Dialog
          open={!!dialog}
          onOpenChange={(open) => {
            if (!open && !busy) {
              setDialog(null);
              setError(null);
            }
          }}
        >
          <DialogContent
            title={
              dialog?.kind === "delete"
                ? "Delete form?"
                : dialog?.kind === "rename"
                  ? "Rename form"
                  : "Create a form"
            }
            description={
              dialog?.kind === "delete"
                ? `“${dialog.form.title}” and all ${dialog.form.response_count} responses will be permanently deleted. Its public link will stop working.`
                : dialog?.kind === "rename"
                  ? "Give your form a name that’s easy to find."
                  : "Every great conversation starts with a question. What will you call yours?"
            }
            busy={busy}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              if (dialog?.kind === "delete") cancelButton.current?.focus();
              else nameInput.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocus.current?.isConnected) returnFocus.current.focus();
              else createButton.current?.focus();
            }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!dialog || busy) return;
                if (dialog.kind === "delete")
                  operation.mutate({ kind: "delete", form: dialog.form });
                else if (!name.trim()) setError("Give your form a name.");
                else
                  operation.mutate(
                    dialog.kind === "create"
                      ? { kind: "create", title: name.trim() }
                      : {
                          kind: "rename",
                          form: dialog.form,
                          title: name.trim(),
                        },
                  );
              }}
            >
              {dialog?.kind !== "delete" && (
                <>
                  <label
                    htmlFor="form-name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Form name
                  </label>
                  <input
                    ref={nameInput}
                    id="form-name"
                    value={name}
                    required
                    maxLength={200}
                    disabled={busy}
                    aria-invalid={!!error}
                    aria-describedby={error ? "form-error" : undefined}
                    placeholder="e.g. Product feedback"
                    onChange={(event) => {
                      setName(event.target.value);
                      setError(null);
                    }}
                    className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base"
                  />
                </>
              )}
              {error && (
                <p
                  id="form-error"
                  role="alert"
                  className="mt-3 text-sm leading-5 text-[var(--danger)]"
                >
                  {error}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  ref={cancelButton}
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setDialog(null);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={dialog?.kind === "delete" ? "danger" : "primary"}
                  disabled={
                    busy ||
                    (dialog?.kind !== "delete" &&
                      (!name.trim() ||
                        (dialog?.kind === "rename" &&
                          name.trim() === dialog.form.title)))
                  }
                >
                  {busy && (
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {busy
                    ? "Saving…"
                    : dialog?.kind === "delete"
                      ? "Delete form"
                      : dialog?.kind === "rename"
                        ? "Save"
                        : "Create form"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </WorkspaceShell>
  );
}
