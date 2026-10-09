"use client";

import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceShell } from "@/components/workspace-shell";
import { creatorApi } from "@/lib/api/forms";
import { useCreatorSession, WorkspaceLoading, WorkspaceError } from "./session";

export function FormOverview({ id }: { id: string }) {
  const session = useCreatorSession();
  const form = useQuery({
    queryKey: ["creator", "form", session.data?.workspace_id, id],
    queryFn: () => creatorApi.form(id),
    enabled: !!session.data,
    retry: false,
  });
  const data = form.data;
  return (
    <WorkspaceShell>
      <div className="p-5 md:p-8">
        <Link
          href="/forms"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to forms
        </Link>
        {session.isPending || (!!session.data && form.isPending) ? (
          <WorkspaceLoading />
        ) : session.isError || form.isError ? (
          <WorkspaceError
            message={
              session.error?.message ??
              form.error?.message ??
              "Please try again."
            }
            retry={() => {
              if (session.isError) void session.refetch();
              else if (form.error && !session.recover(form.error))
                void form.refetch();
            }}
          />
        ) : (
          data && (
            <>
              <h1 className="text-2xl font-medium break-words">
                {data.form.title}
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                {data.form.is_published ? "Published" : "Draft"} ·{" "}
                {data.draft.questions?.length ?? 0} questions ·{" "}
                {data.form.response_count} responses
              </p>
              <div className="my-8 rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start gap-4">
                  <span className="rounded-xl bg-surface-muted p-3">
                    <FilePlus2 size={24} strokeWidth={1.4} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-medium">Your form is ready</h2>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      Question editing is coming soon. You can already organize,
                      rename and duplicate your forms from the workspace.
                    </p>
                  </div>
                </div>
                {!!data.draft.questions?.length && (
                  <ol className="mt-6 divide-y divide-border border-t border-border">
                    {data.draft.questions.map((question, index) => (
                      <li
                        key={question.question_key}
                        className="flex items-start gap-3 py-4"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs">
                          {index + 1}
                        </span>
                        <span className="min-w-0 break-words">
                          {question.title || "Untitled question"}
                          <span className="mt-1 block text-xs text-text-muted">
                            {question.type.replaceAll("_", " ")}
                            {question.required ? " · required" : ""}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )
        )}
      </div>
    </WorkspaceShell>
  );
}
