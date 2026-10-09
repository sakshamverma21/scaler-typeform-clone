import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";

afterEach(() => vi.unstubAllGlobals());

describe("API failure handling", () => {
  it("preserves caller Headers objects, including revision preconditions", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"status":"ok"}'));
    vi.stubGlobal("fetch", fetch);
    await apiRequest("/api/v1/health/ready", {
      headers: new Headers({ "If-Match": '"7"' }),
    });
    expect(fetch.mock.calls[0][1].headers.get("If-Match")).toBe('"7"');
  });
  it("preserves structured validation errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ code: "not_ready", message: "Please retry." }),
            { status: 503 },
          ),
        ),
    );
    await expect(apiRequest("/api/v1/health/ready")).rejects.toMatchObject({
      status: 503,
      code: "not_ready",
      message: "Please retry.",
    });
  });
  it("handles a proxy returning HTML rather than JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<html>Gateway failure</html>", { status: 502 }),
        ),
    );
    await expect(apiRequest("/api/v1/health/ready")).rejects.toMatchObject({
      status: 502,
      code: "request_failed",
    });
  });
  it("makes network failures recoverable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(apiRequest("/api/v1/health/ready")).rejects.toMatchObject({
      status: 0,
      code: "connection_failed",
    });
  });
  it("retains question and field errors and rejects malformed error entries", async () => {
    const errors = [
      { question_key: "question", message: "Please fill this in." },
      { field: "body.answers.0.value", message: "Invalid value." },
      { message: 5 },
      null,
      { question_key: 5, message: "Invalid shape" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "invalid_answers",
            message: "Check your answers.",
            errors,
          }),
          { status: 422 },
        ),
      ),
    );
    await expect(
      apiRequest("/api/v1/public/forms/test/responses"),
    ).rejects.toMatchObject({
      status: 422,
      code: "invalid_answers",
      errors: errors.slice(0, 2),
    });
  });
});
