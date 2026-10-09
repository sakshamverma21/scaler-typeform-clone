"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creatorApi } from "@/lib/api/forms";
import { ApiError } from "@/lib/api/client";

let bootstrap: ReturnType<typeof creatorApi.session> | null = null;
function initialize() {
  if (!bootstrap) {
    bootstrap = creatorApi.session().then(
      (result) => {
        bootstrap = null;
        return result;
      },
      (error) => {
        bootstrap = null;
        throw error;
      },
    );
  }
  return bootstrap;
}

export function useCreatorSession() {
  const cache = useQueryClient();
  const session = useQuery({
    queryKey: ["creator-session"],
    queryFn: initialize,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  function recover(error: Error) {
    if (!(error instanceof ApiError) || error.status !== 401) return false;
    cache.removeQueries({ queryKey: ["creator"] });
    void cache.resetQueries({ queryKey: ["creator-session"] });
    return true;
  }
  return { ...session, recover };
}

export function WorkspaceLoading() {
  return (
    <div className="py-8" role="status" aria-label="Loading forms">
      <p className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        Opening your workspace… The backend may take a moment to wake up.
      </p>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="mb-3 flex h-20 items-center gap-4 rounded-xl border border-border bg-surface px-5"
        >
          <div className="skeleton size-10" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function WorkspaceError({
  message,
  retry,
  busy = false,
}: {
  message: string;
  retry: () => void;
  busy?: boolean;
}) {
  return (
    <div
      role="alert"
      className="my-8 flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-canvas p-6 text-center"
    >
      <WifiOff size={28} className="mb-4 text-text-muted" aria-hidden="true" />
      <h2 className="text-lg font-medium">We couldn’t open your workspace</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
        {message}
      </p>
      <Button
        className="mt-5"
        variant="secondary"
        disabled={busy}
        onClick={retry}
      >
        <RefreshCw size={15} aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
