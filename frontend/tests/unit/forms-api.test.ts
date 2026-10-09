import { afterEach, expect, it, vi } from "vitest";
import { creatorApi, publicApi } from "@/lib/api/forms";

afterEach(() => vi.unstubAllGlobals());

it("sends revision-protected JSON saves without replacing a caller's mutation ID", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetch);
  const body = { mutation_id: "fixed-id", definition: { title: "Draft" } };
  await creatorApi.save("form/id", body, 4);
  expect(fetch.mock.calls[0][0]).toBe("/api/v1/creator/forms/form%2Fid/draft");
  const request = fetch.mock.calls[0][1];
  expect(request.headers.get("If-Match")).toBe('"4"');
  expect(request.headers.get("Content-Type")).toBe("application/json");
  expect(request.credentials).toBe("same-origin");
  expect(JSON.parse(request.body)).toEqual(body);
});

it("encodes version pagination and preserves the public submission key", async () => {
  const fetch = vi
    .fn()
    .mockImplementation(() => Promise.resolve(new Response("{}")));
  vi.stubGlobal("fetch", fetch);
  await creatorApi.responses("form", {
    limit: 10,
    cursor: "a+b=",
    version_id: "v",
  });
  expect(fetch.mock.calls[0][0]).toBe(
    "/api/v1/creator/forms/form/responses?limit=10&cursor=a%2Bb%3D&version_id=v",
  );
  const body = {
    version_id: "version",
    submission_key: "retry-key",
    answers: [],
  };
  await publicApi.submit("slug", body);
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(body);
});
