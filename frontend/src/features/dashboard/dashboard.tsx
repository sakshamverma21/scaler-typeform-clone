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
  LayoutGrid,
  List,
  LoaderCircle,
  Plus,
  Sparkles,
  UserPlus,
  MoreHorizontal,
  Blocks,
  X,
} from "lucide-react";
import { WorkspaceShell, WorkspaceCover } from "@/components/workspace-shell";
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
  const [sort, setSort] = useState("created");
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>(
    [],
  );
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
    <WorkspaceShell
      onCreate={openCreate}
      createRef={createButton}
      disabled={!workspaceId || busy}
      search={search}
      onSearch={setSearch}
      formCount={allForms.length}
      responses={allForms.reduce(
        (total, form) => total + form.response_count,
        0,
      )}
    >
      <div className="p-5 md:px-10 md:py-12 2xl:px-[52px]">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-[#e3e1e6] pb-6">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[28px] font-normal tracking-tight">
              My workspace
            </h1>
            <button
              aria-label="Workspace options"
              onClick={() =>
                notify("Your workspace is private to this browser.")
              }
              className="rounded-md p-1 hover:bg-[#ececef]"
            >
              <MoreHorizontal size={21} />
            </button>
            <button
              onClick={() =>
                notify(
                  "Team invitations are coming soon. Public form sharing is available after publishing.",
                )
              }
              className="flex items-center gap-2 text-base text-[#6d6573]"
            >
              <UserPlus size={21} />
              Invite
            </button>
            <span
              className="hidden rounded-full border border-[#b9e4dc] p-1.5 text-[#087c6a] sm:inline-flex"
              aria-hidden="true"
            >
              <Sparkles size={17} />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[#e2dfe4] bg-white px-3 text-[#6d6573]">
              <CalendarDays size={20} aria-hidden="true" />
              <select
                aria-label="Sort forms"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="min-w-0 bg-transparent text-sm outline-offset-2"
              >
                <option value="created">Date created</option>
                <option value="updated">Last updated</option>
                <option value="name">Name</option>
              </select>
            </label>
            <div
              className="flex overflow-hidden rounded-xl border border-[#e2dfe4] bg-white"
              aria-label="Form view"
            >
              <button
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                className={`flex h-10 items-center gap-2 px-3 text-sm ${view === "list" ? "bg-[#ececef]" : "text-[#6d6573]"}`}
              >
                <List size={20} />
                List
              </button>
              <button
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
                className={`flex h-10 items-center gap-2 px-3 text-sm ${view === "grid" ? "bg-[#ececef]" : "text-[#6d6573]"}`}
              >
                <LayoutGrid size={19} />
                Grid
              </button>
            </div>
          </div>
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
            <div className="mt-8 mb-10 grid gap-5 xl:grid-cols-2">
              {[
                {
                  id: "feedback",
                  title: "Product feedback",
                  copy: "Gather thoughtful feedback and learn what your customers need.",
                },
                {
                  id: "event",
                  title: "Event registration",
                  copy: "Bring your next event to life with a simple registration form.",
                },
              ]
                .filter((item) => !dismissedSuggestions.includes(item.id))
                .map((item) => (
                  <div
                    key={item.id}
                    className="relative flex min-h-[140px] items-start gap-4 rounded-xl bg-[#fdfbff] p-5 pr-12"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f6edff] text-[#a15bbb]">
                      <Sparkles size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-base leading-6">{item.copy}</p>
                      <button
                        disabled={busy}
                        onClick={(event) => {
                          openCreate();
                          returnFocus.current = event.currentTarget;
                          setName(item.title);
                        }}
                        className="mt-4 rounded-lg border border-[#e2dfe4] bg-white px-2.5 py-1 text-sm font-medium text-[#6d6573]"
                      >
                        Create form
                      </button>
                    </div>
                    <button
                      aria-label={`Dismiss ${item.title} suggestion`}
                      onClick={() =>
                        setDismissedSuggestions((current) => [
                          ...current,
                          item.id,
                        ])
                      }
                      className="absolute top-6 right-5 text-[#6d6573]"
                    >
                      <X size={21} />
                    </button>
                  </div>
                ))}
            </div>
            {allForms.some(
              (form) =>
                form.seed_response_count > 0 ||
                form.title.startsWith("Sample:"),
            ) && (
              <p className="mb-4 text-xs leading-5 text-text-muted">
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
                    className="mb-2 hidden grid-cols-[minmax(0,1fr)_95px_95px_120px_100px_40px] items-center gap-4 px-3 text-sm text-text-muted xl:grid"
                  >
                    <span>
                      {filtered.length}{" "}
                      {filtered.length === 1 ? "form" : "forms"}
                    </span>
                    <span>Responses</span>
                    <span>Completed</span>
                    <span>Updated</span>
                    <span>Integrations</span>
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
                      className={`group rounded-2xl border border-[#e2dfe4] bg-surface transition-shadow hover:shadow-sm ${view === "grid" ? "flex min-h-52 flex-col p-5" : "grid grid-cols-[minmax(0,1fr)_40px] items-center gap-4 px-3 py-2.5 xl:grid-cols-[minmax(0,1fr)_95px_95px_120px_100px_40px] xl:px-3"}`}
                    >
                      <div
                        className={`flex min-w-0 items-start gap-3 ${view === "grid" ? "flex-1" : "items-center"}`}
                      >
                        <WorkspaceCover />
                        <div className="min-w-0">
                          <Link
                            href={`/forms/${form.id}/build`}
                            title={form.title}
                            className={`block font-medium outline-offset-4 hover:underline ${view === "grid" ? "line-clamp-2 leading-6" : "truncate"}`}
                          >
                            {form.title || "Untitled form"}
                          </Link>
                          {view === "list" && (
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                              <Status published={form.is_published} />
                              <span className="xl:hidden">
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
                          <div className="hidden text-sm xl:block">
                            {form.response_count}
                            {form.seed_response_count > 0 && (
                              <span className="mt-1 block text-[10px] text-text-muted">
                                {form.seed_response_count} sample
                              </span>
                            )}
                          </div>
                          <span
                            className="hidden text-sm text-text-muted xl:block"
                            title="Completion-rate tracking is coming soon"
                          >
                            —
                          </span>
                          <time
                            dateTime={form.updated_at}
                            className="hidden text-sm text-text-muted xl:block"
                          >
                            {updatedDate(form.updated_at)}
                          </time>
                          <div className="hidden xl:block">
                            <button
                              aria-label={`Integrations for ${form.title}`}
                              title="Integrations — coming soon"
                              onClick={() =>
                                notify("Integrations are coming soon.")
                              }
                              className="flex size-8 items-center justify-center rounded-lg border border-[#e2dfe4] bg-white text-[#6d6573]"
                            >
                              <Blocks size={20} />
                            </button>
                          </div>
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
