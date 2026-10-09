"use client";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { QuestionFlow } from "@/components/questions/question-flow";
import { publicApi } from "@/lib/api/forms";
import { ApiError } from "@/lib/api/client";

export function PublicRespondent({ slug }: { slug: string }) {
  const form = useQuery({
    queryKey: ["public", slug],
    queryFn: () => publicApi.form(slug),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const submissionKeys = useRef(new Map<string, string>());
  if (form.isPending)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white p-8">
        <p role="status" className="animate-pulse text-text-muted">
          Opening your form… The demo server may be waking up.
        </p>
      </main>
    );
  if (form.isError) {
    const unavailable =
      form.error instanceof ApiError && [404, 410].includes(form.error.status);
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-white p-8 text-center">
        <h1 className="text-3xl">
          {unavailable
            ? "This form isn’t available"
            : "We couldn’t open this form"}
        </h1>
        <p className="mt-4 max-w-md text-text-muted">
          {unavailable
            ? "This form is closed or hasn’t been published. Please contact the person who shared it."
            : form.error.message}
        </p>
        {!unavailable && (
          <button
            className="mt-6 rounded-lg bg-text px-5 py-3 text-white"
            onClick={() => void form.refetch()}
          >
            Try again
          </button>
        )}
      </main>
    );
  }
  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <QuestionFlow
        key={form.data.version_id}
        definition={form.data.definition}
        onComplete={async (answers) => {
          const payload = Object.entries(answers).map(
            ([question_key, value]) => ({ question_key, value }),
          );
          const fingerprint = JSON.stringify(payload);
          let key = submissionKeys.current.get(fingerprint);
          if (!key) {
            key = crypto.randomUUID();
            submissionKeys.current.set(fingerprint, key);
          }
          await publicApi.submit(slug, {
            version_id: form.data.version_id,
            submission_key: key,
            answers: payload,
          });
        }}
      />
    </main>
  );
}
