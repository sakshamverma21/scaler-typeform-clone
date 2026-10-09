import { WorkspaceShell } from "@/components/workspace-shell";

export default function Loading() {
  return (
    <WorkspaceShell>
      <div className="p-8" role="status" aria-label="Loading workspace">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton mt-4 h-4 w-64 max-w-full" />
        <div className="skeleton mt-10 h-[400px] w-full" />
      </div>
    </WorkspaceShell>
  );
}
