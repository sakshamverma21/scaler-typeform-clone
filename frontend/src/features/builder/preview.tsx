"use client";
import { useState } from "react";
import { Monitor, Smartphone, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { QuestionFlow } from "@/components/questions/question-flow";
import { creatorApi, type DraftDefinition } from "@/lib/api/forms";
import {
  useCreatorSession,
  WorkspaceLoading,
  WorkspaceError,
} from "@/features/dashboard/session";

export function PreviewSurface({
  definition,
}: {
  definition: DraftDefinition;
}) {
  const [mobile, setMobile] = useState(false);
  const [restart, setRestart] = useState(0);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-muted">
          Preview only · answers aren’t collected
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            aria-label="Desktop preview"
            aria-pressed={!mobile}
            onClick={() => setMobile(false)}
            className={`rounded p-2 ${!mobile ? "bg-surface-muted" : ""}`}
          >
            <Monitor size={17} />
          </button>
          <button
            aria-label="Mobile preview"
            aria-pressed={mobile}
            onClick={() => setMobile(true)}
            className={`rounded p-2 ${mobile ? "bg-surface-muted" : ""}`}
          >
            <Smartphone size={17} />
          </button>
        </div>
        <button
          onClick={() => setRestart((r) => r + 1)}
          className="text-xs underline underline-offset-4"
        >
          Restart
        </button>
      </div>
      <div
        className={`mx-auto flex h-[min(66dvh,650px)] min-h-80 flex-col overflow-y-auto rounded-xl border border-border bg-white ${mobile ? "max-w-[390px] shadow-lg" : "w-full"}`}
        data-testid="preview-frame"
      >
        <QuestionFlow key={restart} definition={definition} preview />
      </div>
    </div>
  );
}

export function PreviewPage({ id }: { id: string }) {
  const session = useCreatorSession();
  const form = useQuery({
    queryKey: ["creator", "form", session.data?.workspace_id, id],
    queryFn: () => creatorApi.form(id),
    enabled: !!session.data,
    retry: false,
    staleTime: 0,
  });
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href={`/forms/${id}/build`}
        className="mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft size={16} />
        Back to builder
      </Link>
      <h1 className="mb-4 text-xl font-medium">Form preview</h1>
      {session.isPending || (!!session.data && form.isPending) ? (
        <WorkspaceLoading />
      ) : session.isError || form.isError ? (
        <WorkspaceError
          message={
            session.error?.message ??
            form.error?.message ??
            "Couldn’t load the preview."
          }
          retry={() => {
            if (session.isError) void session.refetch();
            else if (!session.recover(form.error!)) void form.refetch();
          }}
        />
      ) : (
        form.data && <PreviewSurface definition={form.data.draft} />
      )}
    </main>
  );
}
