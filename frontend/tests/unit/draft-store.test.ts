import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DraftStore } from "@/features/builder/draft-store";
import { creatorApi, type FormDetail } from "@/lib/api/forms";
import { ApiError } from "@/lib/api/client";

const initial: FormDetail = {
  form: {
    id: "form",
    title: "Original",
    is_published: false,
    public_slug: null,
    draft_revision: 0,
    last_save_mutation_id: null,
    created_at: "2026-10-09T00:00:00Z",
    updated_at: "2026-10-09T00:00:00Z",
    response_count: 0,
    seed_response_count: 0,
  },
  draft: { title: "Original", questions: [] },
};
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("serializes queued edits without replacing a newer local definition with an old acknowledgement", async () => {
  let resolve!: (result: FormDetail) => void;
  const first = new Promise<FormDetail>((done) => {
    resolve = done;
  });
  const save = vi
    .spyOn(creatorApi, "save")
    .mockImplementationOnce(() => first)
    .mockImplementation(async (_id, body, revision) => ({
      form: { ...initial.form, draft_revision: revision + 1 },
      draft: body.definition,
    }));
  const store = new DraftStore("form", "workspace", initial, vi.fn());
  store.dispatch({ type: "title", title: "First edit" });
  const flushed = store.flush();
  store.dispatch({ type: "title", title: "Newest edit" });
  resolve({
    ...initial,
    form: { ...initial.form, draft_revision: 1 },
    draft: { title: "First edit", questions: [] },
  });
  expect(await flushed).toBe(true);
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls.map((call) => call[2])).toEqual([0, 1]);
  expect(store.getSnapshot().definition.title).toBe("Newest edit");
  expect(store.getSnapshot().status).toBe("Saved");
  store.synchronize(initial);
  expect(store.getSnapshot().definition.title).toBe("Newest edit");
  store.synchronize({
    ...initial,
    form: { ...initial.form, draft_revision: 3 },
    draft: { title: "Fresh server version", questions: [] },
  });
  expect(store.getSnapshot().definition.title).toBe("Fresh server version");
  expect(sessionStorage.length).toBe(0);
  store.dispose();
});

it("retries the exact failed mutation before saving edits made during the failure", async () => {
  const save = vi
    .spyOn(creatorApi, "save")
    .mockRejectedValueOnce(new ApiError(0, "connection_failed", "Offline"))
    .mockImplementation(async (_id, body, revision) => ({
      form: { ...initial.form, draft_revision: revision + 1 },
      draft: body.definition,
    }));
  const store = new DraftStore("form", "workspace", initial, vi.fn());
  store.dispatch({ type: "title", title: "Retained" });
  expect(await store.flush()).toBe(false);
  store.dispatch({ type: "title", title: "Newer" });
  expect(await store.retry()).toBe(true);
  expect(save.mock.calls[0][1]).toEqual(save.mock.calls[1][1]);
  expect(save.mock.calls[0][2]).toBe(save.mock.calls[1][2]);
  expect(save).toHaveBeenCalledTimes(3);
  expect(store.getSnapshot().definition.title).toBe("Newer");
  store.dispose();
});

it("keeps local conflict edits and restores a failed request after a tab reload", async () => {
  const save = vi
    .spyOn(creatorApi, "save")
    .mockRejectedValue(new ApiError(412, "revision_conflict", "Stale"));
  vi.spyOn(creatorApi, "form").mockResolvedValue({
    ...initial,
    form: { ...initial.form, draft_revision: 1 },
    draft: { title: "Other tab", questions: [] },
  });
  const store = new DraftStore("form", "workspace", initial, vi.fn());
  store.dispatch({ type: "title", title: "Local draft" });
  expect(await store.flush()).toBe(false);
  expect(store.getSnapshot().status).toBe("Conflict");
  expect(await store.retry()).toBe(false);
  expect(save).toHaveBeenCalledTimes(1);
  store.dispose();
  const recovered = new DraftStore(
    "form",
    "workspace",
    { ...initial, form: { ...initial.form, draft_revision: 1 } },
    vi.fn(),
  );
  expect(recovered.getSnapshot().recovery?.definition.title).toBe(
    "Local draft",
  );
  recovered.discardRecovery();
  expect(sessionStorage.length).toBe(0);
  recovered.dispose();
});
