"use client";

import { useState, useEffect, useSyncExternalStore, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Play,
  Palette,
  Settings,
  List,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Check,
  LoaderCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNotify } from "@/components/ui/notifications";
import { creatorApi, type FormDetail } from "@/lib/api/forms";
import {
  newQuestion,
  questionTypes,
  type QuestionType,
  type Question,
} from "@/components/questions/registry";
import {
  useCreatorSession,
  WorkspaceError,
  WorkspaceLoading,
} from "@/features/dashboard/session";
import { DraftStore } from "./draft-store";
import { QuestionList } from "./question-list";
import { QuestionSettings } from "./question-settings";
import { QuestionCanvas } from "./question-canvas";
import { QuestionPicker } from "./question-picker";
import { PreviewSurface } from "./preview";

export function Builder({ id }: { id: string }) {
  const session = useCreatorSession();
  const form = useQuery({
    queryKey: ["creator", "form", session.data?.workspace_id, id],
    queryFn: () => creatorApi.form(id),
    enabled: !!session.data,
    retry: false,
    staleTime: 0,
  });
  if (session.isPending || (!!session.data && form.isPending))
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <WorkspaceLoading />
      </main>
    );
  if (session.isError || form.isError)
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <Link href="/forms">← Back to forms</Link>
        <WorkspaceError
          message={
            session.error?.message ??
            form.error?.message ??
            "Couldn’t load this form."
          }
          retry={() => {
            if (session.isError) void session.refetch();
            else if (!session.recover(form.error!)) void form.refetch();
          }}
        />
      </main>
    );
  return form.data && session.data ? (
    <BuilderEditor
      key={`${session.data.workspace_id}:${id}`}
      initial={form.data}
      workspaceId={session.data.workspace_id}
    />
  ) : null;
}

function BuilderEditor({
  initial,
  workspaceId,
}: {
  initial: FormDetail;
  workspaceId: string;
}) {
  const cache = useQueryClient();
  const router = useRouter();
  const notify = useNotify();
  const [store] = useState(
    () =>
      new DraftStore(initial.form.id, workspaceId, initial, (result) => {
        cache.setQueryData(
          ["creator", "form", workspaceId, initial.form.id],
          result,
        );
        void cache.invalidateQueries({
          queryKey: ["creator", "forms", workspaceId],
        });
      }),
  );
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const draft = snapshot.definition;
  const questions = draft.questions ?? [];
  const [selected, setSelected] = useState<string | null>(
    questions[0]?.question_key ?? null,
  );
  const question =
    questions.find((q) => q.question_key === selected) ?? questions[0];
  const position = question ? questions.indexOf(question) : -1;
  const [picker, setPickerState] = useState(false);
  const pickerTrigger = useRef<HTMLElement | null>(null);
  const panelTrigger = useRef<HTMLElement | null>(null);
  function setPicker(open: boolean) {
    if (open)
      pickerTrigger.current = document.activeElement as HTMLElement | null;
    setPickerState(open);
  }
  const [panel, setPanelState] = useState<
    | "questions"
    | "settings"
    | "preview"
    | "design"
    | "ending"
    | "workflow"
    | "connect"
    | "share"
    | "results"
    | "reload"
    | "delete"
    | null
  >(null);
  function setPanel(next: typeof panel) {
    if (next)
      panelTrigger.current = document.activeElement as HTMLElement | null;
    setPanelState(next);
  }
  const [busy, setBusy] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const safeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    store.synchronize(initial);
  }, [initial, store]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (store.dirty || store.getSnapshot().recovery) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("beforeunload", unload);
      store.dispose();
    };
  }, [store]);
  async function navigate(path: string) {
    setBusy(true);
    setNavigationError(null);
    if (await store.flush()) router.push(path);
    else
      setNavigationError(
        "Save or resolve your draft changes before leaving. Your local edits are kept here.",
      );
    setBusy(false);
  }
  function edit(patch: Partial<Question>) {
    if (question)
      store.dispatch({ type: "edit", key: question.question_key, patch });
  }
  function add(type: QuestionType) {
    const q = newQuestion(type);
    store.dispatch({ type: "add", question: q, after: question?.question_key });
    setSelected(q.question_key);
    setPanel(null);
  }
  function move(delta: number) {
    if (
      !question ||
      position + delta < 0 ||
      position + delta >= questions.length
    )
      return;
    const next = questions.map((q) => q.question_key);
    next.splice(position, 1);
    next.splice(position + delta, 0, question.question_key);
    store.dispatch({ type: "reorder", keys: next });
  }
  function duplicate() {
    if (!question || questions.length >= 100) return;
    const copy = {
      ...question,
      question_key: crypto.randomUUID(),
      options: (question.options ?? []).map((o) => ({
        ...o,
        option_key: crypto.randomUUID(),
      })),
    };
    store.dispatch({
      type: "add",
      question: copy,
      after: question.question_key,
    });
    setSelected(copy.question_key);
    notify("Question duplicated.");
  }
  function remove() {
    if (!question) return;
    store.dispatch({ type: "delete", key: question.question_key });
    setSelected(
      questions[position + 1]?.question_key ??
        questions[position - 1]?.question_key ??
        null,
    );
    setPanel(null);
    notify("Question removed from the draft.");
  }
  const settings = (
    <QuestionSettings
      question={question}
      edit={edit}
      changeType={(questionType) =>
        question &&
        store.dispatch({
          type: "change-type",
          key: question.question_key,
          questionType,
        })
      }
    />
  );
  const list = (
    <QuestionList
      questions={questions}
      selected={question?.question_key ?? null}
      select={(key) => {
        setSelected(key);
        setPanel(null);
      }}
      reorder={(keys) => store.dispatch({ type: "reorder", keys })}
      add={() => setPicker(true)}
      ending={() => setPanel("ending")}
    />
  );
  return (
    <main id="main-content" className="flex min-h-dvh flex-col bg-white">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            aria-label="Back to forms"
            href="/forms"
            onClick={(event) => {
              if (
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                void navigate("/forms");
              }
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-surface-muted"
          >
            <ArrowLeft size={17} />
          </Link>
          <span className="hidden text-text-muted sm:block">Forms /</span>
          <h1 aria-label={draft.title || "Untitled form"} className="min-w-0">
            <input
              aria-label="Form name"
              disabled={!!snapshot.recovery}
              maxLength={200}
              value={draft.title}
              placeholder="Untitled form"
              onChange={(event) =>
                store.dispatch({ type: "title", title: event.target.value })
              }
              className="min-h-9 w-full max-w-80 rounded border border-transparent bg-transparent px-2 text-sm font-medium hover:border-border focus:border-border"
            />
          </h1>
        </div>
        <nav
          aria-label="Form sections"
          className="order-3 flex w-full items-center gap-5 overflow-x-auto text-xs sm:order-none sm:w-auto"
        >
          <span
            className="border-b-2 border-text py-2 font-medium"
            aria-current="page"
          >
            Content
          </span>
          {(["workflow", "connect", "share", "results"] as const).map(
            (item) => (
              <button
                key={item}
                onClick={() => setPanel(item)}
                className="py-2 text-text-muted hover:text-text"
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ),
          )}
        </nav>
        <div
          className="flex items-center gap-2 text-xs"
          role="status"
          data-testid="save-status"
        >
          {snapshot.status === "Saving" ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : snapshot.status === "Saved" ? (
            <Check size={14} className="text-green-700" />
          ) : (
            <span
              className={`size-1.5 rounded-full ${snapshot.error ? "bg-red-600" : "bg-amber-500"}`}
            />
          )}
          {snapshot.status}
        </div>
      </header>
      {(snapshot.error || navigationError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 border-b border-[#edc5c0] bg-[#fff2ef] px-5 py-3 text-xs text-[#a52217]"
        >
          <span className="flex-1">{snapshot.error ?? navigationError}</span>
          {snapshot.status !== "Conflict" && (
            <button
              onClick={() => {
                setNavigationError(null);
                void store.retry();
              }}
              className="font-medium underline underline-offset-4"
            >
              Retry save
            </button>
          )}
          <button
            onClick={() => setPanel("reload")}
            className="underline underline-offset-4"
          >
            Reload saved version
          </button>
        </div>
      )}
      {snapshot.recovery && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 border-b border-[#ead5a4] bg-[#fff8e7] px-5 py-3 text-xs"
        >
          <span className="flex-1">
            An unsaved draft was recovered in this tab. Restore it or keep the
            saved version.
          </span>
          <button
            className="font-medium underline"
            onClick={() => store.restore()}
          >
            Restore local draft
          </button>
          <button className="underline" onClick={() => store.discardRecovery()}>
            Keep saved version
          </button>
        </div>
      )}
      <fieldset
        disabled={!!snapshot.recovery}
        className="grid min-w-0 flex-1 gap-4 p-3 lg:grid-cols-[240px_minmax(0,1fr)_256px] lg:p-4"
      >
        <aside
          className="hidden min-h-0 lg:block"
          aria-label="Question navigation"
        >
          {list}
        </aside>
        <section className="flex min-w-0 flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2">
            <div className="flex items-center gap-1">
              <Button
                ref={addButton}
                className="min-h-9 px-3 text-xs"
                disabled={questions.length >= 100}
                onClick={() => setPicker(true)}
              >
                <Plus size={15} />
                Add content
              </Button>
              <Button
                variant="ghost"
                className="min-h-9 px-3 text-xs"
                onClick={() => setPanel("design")}
              >
                <Palette size={15} />
                Design
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                className="min-h-9 px-2 text-xs lg:hidden"
                onClick={() => setPanel("questions")}
                aria-label="Open questions"
              >
                <List size={17} />
              </Button>
              <Button
                variant="ghost"
                className="min-h-9 px-2 text-xs lg:hidden"
                onClick={() => setPanel("settings")}
                aria-label="Open settings"
              >
                <Settings size={17} />
              </Button>
              <Button
                variant="ghost"
                className="min-h-9 px-3 text-xs"
                onClick={() => setPanel("preview")}
              >
                <Play size={16} />
                Preview
              </Button>
            </div>
          </div>
          {question && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2">
              <p className="text-[11px] text-text-muted">
                Question {position + 1} of {questions.length} ·{" "}
                {questionTypes[question.type].label}
              </p>
              <div className="flex gap-1">
                <button
                  aria-label="Move question up"
                  disabled={!position}
                  onClick={() => move(-1)}
                  className="rounded p-2 text-text-muted hover:bg-surface-muted disabled:opacity-25"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  aria-label="Move question down"
                  disabled={position === questions.length - 1}
                  onClick={() => move(1)}
                  className="rounded p-2 text-text-muted hover:bg-surface-muted disabled:opacity-25"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  aria-label="Duplicate question"
                  disabled={questions.length >= 100}
                  onClick={duplicate}
                  className="rounded p-2 text-text-muted hover:bg-surface-muted disabled:opacity-25"
                >
                  <Copy size={15} />
                </button>
                <button
                  aria-label="Delete question"
                  onClick={() => setPanel("delete")}
                  className="rounded p-2 text-text-muted hover:bg-[#fff2ef] hover:text-red-700"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}
          <div className="flex min-h-[440px] flex-1 rounded-sm border border-[#efedf0] bg-[#fbfafb] lg:min-h-[600px]">
            <QuestionCanvas
              key={question?.question_key ?? "empty"}
              question={question}
              position={position}
              edit={edit}
              add={() => setPicker(true)}
            />
          </div>
          <p className="px-2 py-3 text-[11px] leading-5 text-text-muted">
            Click the question or choices to edit. Use Preview to try the
            conversation. Draft edits don’t change a published form.
          </p>
        </section>
        <aside className="hidden lg:block" aria-label="Question settings panel">
          {settings}
        </aside>
      </fieldset>
      <QuestionPicker
        open={picker}
        setOpen={setPicker}
        choose={add}
        onClosed={() => {
          if (pickerTrigger.current?.isConnected) pickerTrigger.current.focus();
          else addButton.current?.focus();
        }}
      />
      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPanel(null);
        }}
      >
        <DialogContent
          title={
            panel === "preview"
              ? "Try your form"
              : panel === "questions"
                ? "Questions"
                : panel === "settings"
                  ? "Question settings"
                  : panel === "delete"
                    ? "Delete this question?"
                    : panel === "reload"
                      ? "Reload the saved version?"
                      : panel === "ending"
                        ? "Thank you screen"
                        : panel === "design"
                          ? "Form design"
                          : panel
                            ? panel[0].toUpperCase() + panel.slice(1)
                            : "Form settings"
          }
          description={
            panel === "preview"
              ? "This uses your current draft, including unsaved changes."
              : panel === "delete"
                ? "This removes the question from your draft. Published forms and previous responses keep their original question."
                : panel === "reload"
                  ? "Your local unsaved changes will be discarded. This cannot be undone."
                  : panel === "questions"
                    ? "Select or reorder your form questions."
                    : panel === "settings"
                      ? "Configure the selected question."
                      : "Available features are shown below."
          }
          className={panel === "preview" ? "max-w-5xl" : ""}
          busy={busy}
          onOpenAutoFocus={(event) => {
            if (panel === "delete" || panel === "reload") {
              event.preventDefault();
              safeButton.current?.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (panelTrigger.current?.isConnected) panelTrigger.current.focus();
            else addButton.current?.focus();
          }}
        >
          {panel === "preview" ? (
            <>
              <PreviewSurface definition={draft} />
              <button
                disabled={busy}
                onClick={() =>
                  void navigate(`/forms/${initial.form.id}/preview`)
                }
                className="mt-4 inline-flex items-center gap-2 text-xs underline"
              >
                <ExternalLink size={14} />
                Open saved preview page
              </button>
            </>
          ) : panel === "questions" ? (
            <div className="h-[60dvh]">{list}</div>
          ) : panel === "settings" ? (
            settings
          ) : panel === "delete" || panel === "reload" ? (
            <>
              <p className="text-sm leading-6">
                {panel === "delete"
                  ? question?.title || "Untitled question"
                  : "Save a copy of anything you want to keep before continuing."}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  ref={safeButton}
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setPanel(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => {
                    if (panel === "delete") remove();
                    else {
                      setBusy(true);
                      void store
                        .reload()
                        .then(() => {
                          setPanel(null);
                          setNavigationError(null);
                        })
                        .catch((error) => setNavigationError(error.message))
                        .finally(() => setBusy(false));
                    }
                  }}
                >
                  {panel === "delete"
                    ? "Delete question"
                    : "Discard and reload"}
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border bg-surface-muted p-5 text-sm leading-6">
              {panel === "ending" ? (
                <>
                  <p className="text-xl">
                    {draft.ending_settings?.title || "Thank you!"}
                  </p>
                  <p className="mt-3 text-text-muted">
                    {draft.ending_settings?.description ||
                      "Your response has been recorded."}
                  </p>
                  <p className="mt-5 text-xs text-text-muted">
                    Ending customization · Coming soon. Preview already includes
                    a working default ending.
                  </p>
                </>
              ) : panel === "design" ? (
                <>
                  <p>Default theme</p>
                  <div className="mt-3 flex gap-2">
                    <span className="size-7 rounded-full border border-border bg-white" />
                    <span className="size-7 rounded-full bg-[#2a222b]" />
                    <span className="size-7 rounded-full bg-[#2563eb]" />
                  </div>
                  <p className="mt-4 text-text-muted">
                    Theme customization · Coming soon. Your existing form theme
                    is preserved.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {panel === "workflow"
                      ? "Advanced logic and branching"
                      : panel === "connect"
                        ? "Integrations and webhooks"
                        : panel === "share"
                          ? "Publishing and public sharing"
                          : "Responses and summaries"}
                  </p>
                  <p className="mt-2 text-text-muted">
                    {panel === "workflow" || panel === "connect"
                      ? "Coming soon. This section is a placeholder."
                      : `The ${panel} interface is part of a later development phase. No action has been performed.`}
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
