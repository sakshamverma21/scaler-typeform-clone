import { ArrowUpRight, FilePlus2, Plus } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/features/foundation/connection-status";

export default function FormsPage() {
  return (
    <WorkspaceShell>
      <div className="p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My forms</h1>
            <p className="mt-2 text-sm text-text-muted">
              A home for your questions and the answers that matter.
            </p>
          </div>
          <Button disabled title="Form creation is coming soon">
            <Plus size={16} aria-hidden="true" />
            Create a form
          </Button>
        </div>
        <section
          aria-labelledby="empty-title"
          className="my-8 flex min-h-[370px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-canvas px-5 py-12 text-center md:my-10 md:min-h-[450px]"
        >
          <div
            aria-hidden="true"
            className="relative mb-8 flex h-24 w-32 items-center justify-center"
          >
            <div className="absolute h-20 w-16 -rotate-12 rounded-lg border border-border bg-[#efeee9]" />
            <div className="relative flex h-24 w-20 rotate-6 items-center justify-center rounded-lg border border-border bg-surface shadow-sm">
              <FilePlus2
                size={28}
                strokeWidth={1.3}
                className="text-text-muted"
              />
            </div>
          </div>
          <h2 id="empty-title" className="text-xl font-medium tracking-tight">
            Your next idea starts here
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-text-muted">
            A thoughtful question can start a great conversation.
            <br className="hidden sm:block" /> Form creation is coming soon.
          </p>
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted">
            Workspace foundation
            <ArrowUpRight size={12} aria-hidden="true" />
          </span>
        </section>
        <ConnectionStatus />
      </div>
    </WorkspaceShell>
  );
}
