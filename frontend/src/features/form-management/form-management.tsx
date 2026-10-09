"use client";
import Link from "next/link";
import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Globe,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { creatorApi } from "@/lib/api/forms";
import { ApiError } from "@/lib/api/client";
import {
  useCreatorSession,
  WorkspaceError,
  WorkspaceLoading,
} from "@/features/dashboard/session";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNotify } from "@/components/ui/notifications";
import type { components } from "@/lib/api/schema";
type AnswerView = components["schemas"]["AnswerView"];
const answerText = (answer: AnswerView) =>
  answer.skipped
    ? "Not answered"
    : typeof answer.display_value === "boolean"
      ? answer.display_value
        ? "Yes"
        : "No"
      : String(answer.display_value ?? "Not answered");
const date = (value: string) => new Date(value).toLocaleString();

export function FormManagement({
  id,
  section,
}: {
  id: string;
  section: "share" | "results";
}) {
  const session = useCreatorSession();
  const cache = useQueryClient();
  const notify = useNotify();
  const key = ["creator", "form", session.data?.workspace_id, id];
  const form = useQuery({
    queryKey: key,
    queryFn: () => creatorApi.form(id),
    enabled: !!session.data,
    retry: false,
  });
  const [confirmClose, setConfirmClose] = useState(false);
  const publish = useMutation({
    mutationFn: async (close: boolean) => {
      const latest = await creatorApi.form(id);
      return close
        ? creatorApi.unpublish(id)
        : creatorApi.publish(id, latest.form.draft_revision);
    },
    onSuccess: (_result, close) => {
      setConfirmClose(false);
      void cache.invalidateQueries({ queryKey: ["creator"] });
      notify(
        close
          ? "Form closed to new responses"
          : "Form published — your link is ready",
      );
    },
  });
  if (session.isPending || (!!session.data && form.isPending))
    return (
      <main className="mx-auto max-w-xl p-8">
        <WorkspaceLoading />
      </main>
    );
  if (session.isError || form.isError)
    return (
      <main className="mx-auto max-w-xl p-8">
        <Link href="/forms">← Back to forms</Link>
        <WorkspaceError
          message={
            session.error?.message ??
            form.error?.message ??
            "Couldn’t load this form"
          }
          retry={() => {
            if (session.isError) void session.refetch();
            else if (!session.recover(form.error!)) void form.refetch();
          }}
        />
      </main>
    );
  if (!form.data) return null;
  const metadata = form.data.form;
  return (
    <main className="min-h-dvh bg-[#f7f7f8] text-[#514957]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-5 py-4 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/forms" aria-label="Back to forms">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="truncate text-base font-medium">
            {metadata.title || "Untitled form"}
          </h1>
        </div>
        <nav aria-label="Form sections" className="flex gap-6 text-sm">
          <Link href={`/forms/${id}/build`}>Content</Link>
          <Link
            href={`/forms/${id}/share`}
            aria-current={section === "share" ? "page" : undefined}
            className={
              section === "share"
                ? "font-semibold underline underline-offset-8"
                : ""
            }
          >
            Share
          </Link>
          <Link
            href={`/forms/${id}/results`}
            aria-current={section === "results" ? "page" : undefined}
            className={
              section === "results"
                ? "font-semibold underline underline-offset-8"
                : ""
            }
          >
            Results
          </Link>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-10">
        {section === "share" ? (
          <>
            <h2 className="text-3xl">Share your form</h2>
            <p className="mt-3 text-text-muted">
              Publish your saved draft, then invite anyone to answer. No login
              required.
            </p>
            <section className="mt-8 rounded-2xl border border-border bg-white p-6 md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Globe
                    size={25}
                    className={
                      metadata.is_published
                        ? "text-emerald-700"
                        : "text-text-muted"
                    }
                  />
                  <div>
                    <h3 className="font-medium">
                      {metadata.is_published
                        ? "Your form is live"
                        : "Your form is closed"}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {metadata.is_published
                        ? "Saved draft changes need publishing to become visible."
                        : "Publish to start collecting responses."}
                    </p>
                  </div>
                </div>
                <Button
                  disabled={publish.isPending}
                  onClick={() => publish.mutate(false)}
                >
                  {publish.isPending && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {metadata.is_published ? "Publish edits" : "Publish form"}
                </Button>
              </div>
              {publish.isError && (
                <div
                  role="alert"
                  className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800"
                >
                  <p>{publish.error.message}</p>
                  {publish.error instanceof ApiError &&
                    publish.error.errors.map((issue, index) => (
                      <p key={index} className="mt-1">
                        {issue.message}
                      </p>
                    ))}
                </div>
              )}
              {metadata.public_slug && (
                <div className="mt-8 border-t border-border pt-6">
                  <label
                    htmlFor="public-link"
                    className="mb-3 block text-sm font-medium"
                  >
                    Public link
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="public-link"
                      readOnly
                      value={
                        typeof window === "undefined"
                          ? `/to/${metadata.public_slug}`
                          : `${window.location.origin}/to/${metadata.public_slug}`
                      }
                      className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-[#f7f7f8] px-3 text-sm"
                    />
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${window.location.origin}/to/${metadata.public_slug}`,
                          );
                          notify("Link copied");
                        } catch {
                          notify(
                            "Copy unavailable. Select and copy the link above.",
                          );
                        }
                      }}
                    >
                      <Copy size={16} />
                      Copy link
                    </Button>
                    <a
                      href={`/to/${metadata.public_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm"
                    >
                      <ExternalLink size={16} />
                      Open form
                    </a>
                  </div>
                </div>
              )}
              {metadata.is_published && (
                <div className="mt-8 border-t border-border pt-6">
                  <Button
                    variant="secondary"
                    disabled={publish.isPending}
                    onClick={() => setConfirmClose(true)}
                  >
                    Unpublish form
                  </Button>
                  <p className="mt-2 text-xs text-text-muted">
                    Closes the link to new submissions. Existing responses
                    remain available.
                  </p>
                </div>
              )}
            </section>
            <Dialog
              open={confirmClose}
              onOpenChange={(open) =>
                !publish.isPending && setConfirmClose(open)
              }
            >
              <DialogContent
                title="Close this form?"
                description="New submissions will be rejected, including from people with the form already open. Your responses remain available."
                busy={publish.isPending}
              >
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmClose(false)}
                    disabled={publish.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => publish.mutate(true)}
                    disabled={publish.isPending}
                  >
                    Close form
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Results
            id={id}
            workspace={session.data!.workspace_id}
            count={metadata.response_count}
          />
        )}
      </div>
    </main>
  );
}

function Results({
  id,
  workspace,
  count,
}: {
  id: string;
  workspace: string;
  count: number;
}) {
  const [tab, setTab] = useState("responses");
  const [version, setVersion] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const versions = useInfiniteQuery({
    queryKey: ["creator", "versions", workspace, id],
    queryFn: ({ pageParam }) =>
      creatorApi.versions(id, { limit: 50, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    retry: false,
  });
  const responses = useInfiniteQuery({
    queryKey: ["creator", "responses", workspace, id, version],
    queryFn: ({ pageParam }) =>
      creatorApi.responses(id, {
        limit: 30,
        cursor: pageParam,
        version_id: version || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    retry: false,
  });
  const summary = useQuery({
    queryKey: ["creator", "summary", workspace, id, version],
    queryFn: () => creatorApi.summary(id, version || undefined),
    enabled: tab === "summary",
    retry: false,
  });
  const detail = useQuery({
    queryKey: ["creator", "response", workspace, id, selected],
    queryFn: () => creatorApi.response(id, selected!),
    enabled: !!selected,
    retry: false,
  });
  const items = responses.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl">
          Results{" "}
          <span className="ml-2 text-lg text-text-muted">
            {count} responses
          </span>
        </h2>
        <Button
          variant="secondary"
          onClick={() => {
            void responses.refetch();
            void summary.refetch();
            void versions.refetch();
          }}
        >
          <RefreshCw size={15} />
          Refresh
        </Button>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex gap-6">
          <button
            onClick={() => setTab("responses")}
            className={
              tab === "responses" ? "font-semibold" : "text-text-muted"
            }
          >
            Responses
          </button>
          <button
            onClick={() => setTab("summary")}
            className={tab === "summary" ? "font-semibold" : "text-text-muted"}
          >
            Response summary
          </button>
        </div>
        <select
          aria-label="Published version"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
          className="max-w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">
            {tab === "summary"
              ? "Latest published version"
              : "All published versions"}
          </option>
          {versions.data?.pages
            .flatMap((page) => page.items)
            .map((item) => (
              <option key={item.id} value={item.id}>
                Version {item.version_number} · {item.response_count} responses
              </option>
            ))}
        </select>
      </div>
      {versions.isError && (
        <p role="alert" className="mt-3 text-red-700">
          Couldn’t load versions. Use Refresh to retry.
        </p>
      )}
      {versions.hasNextPage && (
        <button
          className="mt-3 text-sm underline"
          onClick={() => void versions.fetchNextPage()}
        >
          Load more versions
        </button>
      )}
      <p className="mt-4 text-xs text-text-muted">
        Sample responses are synthetic. Summaries are grouped by publication
        version.
      </p>
      {tab === "responses" ? (
        responses.isPending ? (
          <WorkspaceLoading />
        ) : responses.isError ? (
          <WorkspaceError
            message={responses.error.message}
            retry={() => void responses.refetch()}
          />
        ) : !items.length ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
            <h3 className="text-xl">No responses yet</h3>
            <p className="mt-3 text-text-muted">
              Share your published form to start a conversation.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-[#f9f8fa] text-text-muted">
                  <tr>
                    <th className="px-5 py-4 font-medium">Submitted</th>
                    <th className="px-4 py-4 font-medium">Version</th>
                    <th className="px-4 py-4 font-medium">Answers</th>
                    <th className="px-4 py-4 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-[#fcfaff]"
                    >
                      <td className="px-5 py-4">
                        <button
                          aria-label={`View response ${item.id}`}
                          onClick={() => setSelected(item.id)}
                          className="text-left font-medium underline decoration-[#d6cddd] underline-offset-4"
                        >
                          {date(item.submitted_at)}
                        </button>
                      </td>
                      <td className="px-4 py-4">v{item.version_number}</td>
                      <td className="max-w-xs px-4 py-4">
                        <p className="line-clamp-2">
                          {item.preview.map(answerText).join(" · ") ||
                            "No answers"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-text-muted">
                        {item.is_seed ? "Sample" : "Respondent"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {responses.hasNextPage && (
              <Button
                className="mt-5"
                variant="secondary"
                disabled={responses.isFetchingNextPage}
                onClick={() => void responses.fetchNextPage()}
              >
                Load more responses
              </Button>
            )}
          </>
        )
      ) : summary.isPending ? (
        <WorkspaceLoading />
      ) : summary.isError ? (
        <WorkspaceError
          message={summary.error.message}
          retry={() => void summary.refetch()}
        />
      ) : (
        <>
          <p className="mt-6 text-sm text-text-muted">
            Version {summary.data?.version_number ?? "—"} ·{" "}
            {summary.data?.response_count ?? 0} responses ·{" "}
            {summary.data?.seed_response_count ?? 0} sample
          </p>
          {!summary.data?.questions.length && (
            <p className="mt-8">Publish a form to see question summaries.</p>
          )}
          <div className="mt-5 space-y-4">
            {summary.data?.questions.map((question, index) => (
              <section
                key={question.question_key}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <h3 className="text-lg">
                  {index + 1}. {question.title}
                </h3>
                <p className="mt-2 text-xs text-text-muted">
                  {question.answered_count} answered · {question.skipped_count}{" "}
                  skipped
                </p>
                {question.distribution?.map((bucket) => (
                  <div key={String(bucket.value)} className="mt-5">
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span>{bucket.label}</span>
                      <span>
                        {bucket.count} · {bucket.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded bg-[#eee8f3]">
                      <div
                        className="h-full rounded bg-[#8666a4]"
                        style={{
                          width: `${Math.max(0, Math.min(100, bucket.percentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {question.mean != null && (
                  <div className="mt-5 flex flex-wrap gap-6 text-sm">
                    <span>
                      Average{" "}
                      <strong>
                        {question.mean.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </span>
                    <span>Minimum {question.minimum}</span>
                    <span>Maximum {question.maximum}</span>
                  </div>
                )}
                {!question.answered_count && (
                  <p className="mt-4 text-sm text-text-muted">
                    No answers yet.
                  </p>
                )}
              </section>
            ))}
          </div>
        </>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent
          title="Individual response"
          description={
            detail.data
              ? `${date(detail.data.submitted_at)} · Version ${detail.data.version_number}${detail.data.is_seed ? " · Synthetic sample" : ""}`
              : "Original questions and answers from this submission."
          }
        >
          {detail.isPending ? (
            <WorkspaceLoading />
          ) : detail.isError ? (
            <WorkspaceError
              message={detail.error.message}
              retry={() => void detail.refetch()}
            />
          ) : (
            <dl className="space-y-6">
              {detail.data?.answers.map((answer, index) => (
                <div key={answer.question_key}>
                  <dt className="text-sm text-text-muted">
                    {index + 1}. {answer.title}
                  </dt>
                  <dd className="mt-2 whitespace-pre-wrap break-words text-base">
                    {answerText(answer)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
