"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { checkReadiness, runConnectionCheck } from "./api";

export function ConnectionStatus() {
  const health = useQuery({
    queryKey: ["health", "ready"],
    queryFn: ({ signal }) => checkReadiness(signal),
  });
  const probe = useMutation({ mutationFn: runConnectionCheck });
  const Icon = health.isPending
    ? LoaderCircle
    : health.isError
      ? WifiOff
      : CheckCircle2;
  const label = health.isPending
    ? "Connecting…"
    : health.isError
      ? "Connection unavailable"
      : "Connected";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-text-muted">
      <div
        className="flex items-center gap-2"
        role="status"
        data-testid="connection-status"
      >
        <Icon
          size={14}
          aria-hidden="true"
          className={
            health.isPending
              ? "animate-spin"
              : health.isError
                ? "text-[var(--danger)]"
                : "text-[var(--success)]"
          }
        />
        {label}
      </div>
      {health.isError && (
        <Button
          variant="ghost"
          onClick={() => void health.refetch()}
          disabled={health.isFetching}
        >
          <RefreshCw size={14} aria-hidden="true" />
          Retry connection
        </Button>
      )}
      {process.env.NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED === "true" && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="min-h-9 px-2 text-xs">
              Connection check
            </Button>
          </DialogTrigger>
          <DialogContent
            title="Connection check"
            description="Save a small test record, then read it back using this browser’s private cookie. No form responses are created."
          >
            <div
              className="rounded-lg border border-border bg-canvas p-4 text-sm leading-6"
              aria-live="polite"
            >
              {probe.isPending ? (
                "Checking connection and storage…"
              ) : probe.isError ? (
                <p role="alert" className="text-[var(--danger)]">
                  {probe.error.message}
                </p>
              ) : probe.isSuccess ? (
                <>
                  <p className="font-medium text-[var(--success)]">
                    Cookie and storage verified
                  </p>
                  <p className="mt-2 text-xs text-text-muted">Record ID</p>
                  <p
                    data-testid="probe-id"
                    className="break-all font-mono text-xs"
                  >
                    {probe.data.id}
                  </p>
                </>
              ) : (
                "Ready to check the connection."
              )}
            </div>
            <Button
              className="mt-5 w-full"
              onClick={() => probe.mutate()}
              disabled={probe.isPending}
            >
              {probe.isPending && (
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="animate-spin"
                />
              )}
              {probe.isSuccess
                ? "Check again"
                : probe.isError
                  ? "Retry check"
                  : "Run check"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
