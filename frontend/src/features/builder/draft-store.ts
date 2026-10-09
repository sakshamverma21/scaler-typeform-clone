import {
  creatorApi,
  type DraftDefinition,
  type FormDetail,
} from "@/lib/api/forms";
import { ApiError } from "@/lib/api/client";
import { draftReducer, type BuilderAction } from "./reducer";

type PendingSave = {
  mutation_id: string;
  definition: DraftDefinition;
  revision: number;
  generation: number;
};
type Recovery = {
  revision: number;
  definition: DraftDefinition;
  pending?: PendingSave;
};
export type DraftSnapshot = {
  definition: DraftDefinition;
  revision: number;
  generation: number;
  acknowledged: number;
  status: "Saved" | "Unsaved" | "Saving" | "Save failed" | "Conflict";
  error: string | null;
  recovery: Recovery | null;
};

// One serialized writer per mounted builder. Server acknowledgements never replace
// newer local edits; a failed request retains its exact mutation ID/payload for retry.
export class DraftStore {
  private snapshot: DraftSnapshot;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<boolean> | null = null;
  private pending: PendingSave | null = null;
  private recoveryKey: string;
  constructor(
    private id: string,
    workspaceId: string,
    initial: FormDetail,
    private saved: (detail: FormDetail) => void,
  ) {
    this.recoveryKey = `typeform:draft:${workspaceId}:${id}`;
    let recovery: Recovery | null = null;
    try {
      const stored = JSON.parse(
        sessionStorage.getItem(this.recoveryKey) ?? "null",
      );
      if (
        stored &&
        typeof stored.revision === "number" &&
        typeof stored.definition?.title === "string" &&
        Array.isArray(stored.definition.questions)
      )
        recovery = stored;
    } catch {
      /* Storage is optional; server persistence remains authoritative. */
    }
    this.snapshot = {
      definition: initial.draft,
      revision: initial.form.draft_revision,
      generation: 0,
      acknowledged: 0,
      status: recovery ? "Unsaved" : "Saved",
      error: null,
      recovery,
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(patch: Partial<DraftSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private persist() {
    try {
      if (this.dirty || this.pending)
        sessionStorage.setItem(
          this.recoveryKey,
          JSON.stringify({
            revision: this.snapshot.revision,
            definition: this.snapshot.definition,
            pending: this.pending ?? undefined,
          }),
        );
      else sessionStorage.removeItem(this.recoveryKey);
    } catch {
      /* A denied browser store must not break editing. */
    }
  }
  get dirty() {
    return this.snapshot.generation !== this.snapshot.acknowledged;
  }
  synchronize(detail: FormDetail) {
    if (
      this.dirty ||
      this.running ||
      this.snapshot.recovery ||
      detail.form.draft_revision <= this.snapshot.revision
    )
      return;
    this.emit({
      definition: detail.draft,
      revision: detail.form.draft_revision,
      status: "Saved",
      error: null,
    });
  }
  dispatch(action: BuilderAction) {
    if (this.snapshot.recovery) return;
    const definition = draftReducer(this.snapshot.definition, action);
    if (JSON.stringify(definition) === JSON.stringify(this.snapshot.definition))
      return;
    this.emit({
      definition,
      generation: this.snapshot.generation + 1,
      status: this.snapshot.error
        ? this.snapshot.status
        : this.running
          ? "Saving"
          : "Unsaved",
    });
    this.persist();
    if (!this.snapshot.error && !this.snapshot.recovery) this.schedule();
  }
  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, 600);
  }
  async flush(): Promise<boolean> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.running) return this.running;
    if (
      this.snapshot.recovery ||
      this.snapshot.status === "Conflict" ||
      this.snapshot.status === "Save failed"
    )
      return false;
    this.running = this.drain().finally(() => {
      this.running = null;
    });
    return this.running;
  }
  private async drain(): Promise<boolean> {
    while (this.dirty || this.pending) {
      if (!this.pending)
        this.pending = {
          mutation_id: crypto.randomUUID(),
          definition: this.snapshot.definition,
          revision: this.snapshot.revision,
          generation: this.snapshot.generation,
        };
      const request = this.pending;
      this.persist();
      this.emit({ status: "Saving", error: null });
      let result: FormDetail;
      try {
        result = await creatorApi.save(
          this.id,
          { mutation_id: request.mutation_id, definition: request.definition },
          request.revision,
        );
      } catch (error) {
        // Lost acknowledgement followed by a newer write is distinguishable from
        // another tab: only accept a revision whose last mutation belongs to us.
        if (error instanceof ApiError && error.status === 412) {
          try {
            const latest = await creatorApi.form(this.id);
            if (latest.form.last_save_mutation_id === request.mutation_id)
              result = latest;
            else {
              this.emit({
                status: "Conflict",
                error:
                  "This form changed in another tab. Your edits are kept here. Reload the saved version to continue.",
              });
              this.persist();
              return false;
            }
          } catch {
            this.emit({
              status: "Save failed",
              error:
                "Couldn’t check the latest version. Your edits are kept here. Retry the save.",
            });
            this.persist();
            return false;
          }
        } else {
          this.emit({
            status: "Save failed",
            error:
              error instanceof Error
                ? error.message
                : "Couldn’t save. Your edits are kept here.",
          });
          this.persist();
          return false;
        }
      }
      this.pending = null;
      this.emit({
        revision: result.form.draft_revision,
        acknowledged: request.generation,
        status:
          this.snapshot.generation === request.generation ? "Saved" : "Saving",
        error: null,
      });
      this.saved(result);
      this.persist();
    }
    this.emit({ status: "Saved", error: null });
    return true;
  }
  async retry() {
    if (this.snapshot.status === "Conflict") return false;
    this.emit({ status: "Unsaved", error: null });
    return this.flush();
  }
  restore() {
    const recovery = this.snapshot.recovery;
    if (!recovery) return;
    const conflict =
      recovery.revision !== this.snapshot.revision && !recovery.pending;
    this.pending = recovery.pending
      ? { ...recovery.pending, generation: 1 }
      : null;
    this.emit({
      definition: recovery.definition,
      generation:
        this.pending &&
        JSON.stringify(recovery.definition) !==
          JSON.stringify(this.pending.definition)
          ? 2
          : 1,
      acknowledged: 0,
      recovery: null,
      status: conflict ? "Conflict" : "Unsaved",
      error: conflict
        ? "Recovered edits are from an older version. Reload the saved version to avoid overwriting newer changes."
        : null,
    });
    this.persist();
    if (!conflict) void this.flush();
  }
  discardRecovery() {
    this.emit({ recovery: null, status: "Saved", error: null });
    this.persist();
  }
  async reload() {
    if (this.running) await this.running;
    const latest = await creatorApi.form(this.id);
    this.pending = null;
    this.emit({
      definition: latest.draft,
      revision: latest.form.draft_revision,
      generation: 0,
      acknowledged: 0,
      recovery: null,
      status: "Saved",
      error: null,
    });
    this.persist();
    this.saved(latest);
  }
  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    // Best effort on SPA back/unmount; recovery remains until acknowledgement.
    if (this.dirty && !this.snapshot.error && !this.snapshot.recovery)
      void this.flush();
  }
}
