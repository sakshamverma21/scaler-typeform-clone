import Link from "next/link";
import {
  ChevronDown,
  FolderClosed,
  LayoutGrid,
  LockKeyhole,
} from "lucide-react";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-5 md:px-8">
        <Link
          href="/forms"
          className="flex items-center gap-3"
          aria-label="Typeform Clone workspace"
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-text font-semibold text-white"
            aria-hidden="true"
          >
            tf
          </span>
          <span className="text-base font-semibold tracking-tight">
            typeform{" "}
            <span className="ml-1 text-[10px] font-medium tracking-wide text-text-muted">
              CLONE
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-text-muted sm:inline">
            Personal workspace
          </span>
          <span
            className="flex size-8 items-center justify-center rounded-full bg-[#e8e5dd] text-xs font-semibold"
            aria-label="Demo creator"
          >
            D
          </span>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px] flex-col p-3 md:min-h-[calc(100dvh-64px)] md:flex-row md:gap-3 md:p-4">
        <aside
          aria-label="Workspace navigation"
          className="flex shrink-0 items-center gap-3 rounded-xl bg-surface-muted px-3 py-3 md:w-60 md:flex-col md:items-stretch md:p-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-7 items-center justify-center rounded-md border border-border bg-surface text-xs">
              D
            </span>
            Demo workspace
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="text-text-muted"
            />
          </div>
          <div className="my-4 hidden h-px bg-border md:block" />
          <Link
            href="/forms"
            aria-current="page"
            className="ml-auto flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-sm font-medium md:ml-0"
          >
            <FolderClosed size={16} aria-hidden="true" />
            <span>My forms</span>
          </Link>
          <div className="mt-auto hidden pt-6 text-xs leading-5 text-text-muted md:block">
            <LockKeyhole size={15} aria-hidden="true" className="mb-2" />
            Your demo workspace stays private to this browser.
          </div>
        </aside>
        <main
          id="main-content"
          tabIndex={-1}
          className="mt-3 min-w-0 flex-1 rounded-xl border border-border bg-surface md:mt-0"
        >
          <div className="flex items-center gap-2 border-b border-border px-5 py-4 text-xs text-text-muted md:px-8">
            <LayoutGrid size={14} aria-hidden="true" />
            Workspace
            <span aria-hidden="true" className="mx-1">
              /
            </span>
            <span className="font-medium text-text">My forms</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
