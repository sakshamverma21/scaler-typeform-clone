import { expect, test } from "@playwright/test";
import type { components } from "../../src/lib/api/schema";

type Schemas = components["schemas"];

test("creator cookie, real publish/submit/results workflow, reload and isolation through Next.js", async ({
  page,
  context,
  browser,
}) => {
  await page.goto("/forms");
  const initialized = await page.evaluate(async () => {
    const response = await fetch("/api/v1/creator/session", { method: "POST" });
    return { status: response.status, body: await response.json() };
  });
  expect(initialized.status).toBe(200);
  const cookie = (await context.cookies()).find(
    (item) => item.name === "typeform_creator",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.domain).toBe("localhost");
  expect(cookie?.sameSite).toBe("Lax");

  const createdResponse = await context.request.post("/api/v1/creator/forms", {
    headers: { Origin: "http://localhost:13000" },
    data: { title: "Browser API proof" },
  });
  expect(createdResponse.status()).toBe(201);
  const created = (await createdResponse.json()) as Schemas["FormDetail"];
  const questionKey = crypto.randomUUID();
  created.draft.questions = [
    {
      question_key: questionKey,
      type: "number",
      title: "How many?",
      description: "Browser integration check",
      required: true,
    },
  ];
  const path = `/api/v1/creator/forms/${created.form.id}`;
  const saved = await context.request.put(`${path}/draft`, {
    headers: { Origin: "http://localhost:13000", "If-Match": '"0"' },
    data: { mutation_id: crypto.randomUUID(), definition: created.draft },
  });
  expect(saved.status()).toBe(200);
  expect(saved.headers().etag).toBe('"1"');
  const published = await context.request.post(`${path}/publish`, {
    headers: { Origin: "http://localhost:13000", "If-Match": '"1"' },
  });
  expect(published.status()).toBe(200);
  const meta = (await published.json()) as Schemas["FormMetadata"];
  const publicPath = `/api/v1/public/forms/${meta.public_slug}`;

  const respondent = await browser.newContext({
    baseURL: "http://localhost:13000",
  });
  try {
    const publicForm = (await (
      await respondent.request.get(publicPath)
    ).json()) as Schemas["PublicForm"];
    const submission = {
      version_id: publicForm.version_id,
      submission_key: crypto.randomUUID(),
      answers: [{ question_key: questionKey, value: 0 }],
    };
    const receipt = await respondent.request.post(`${publicPath}/responses`, {
      headers: { Origin: "http://localhost:13000" },
      data: submission,
    });
    expect(receipt.status()).toBe(201);
    const retried = await respondent.request.post(`${publicPath}/responses`, {
      headers: { Origin: "http://localhost:13000" },
      data: submission,
    });
    expect(await retried.json()).toEqual(await receipt.json());
    expect((await respondent.request.get(path)).status()).toBe(401);
    expect(
      (
        await respondent.request.post("/api/v1/creator/session", {
          headers: { Origin: "http://localhost:13000" },
        })
      ).status(),
    ).toBe(200);
    expect((await respondent.request.get(path)).status()).toBe(404);
  } finally {
    await respondent.close();
  }
  await page.reload();
  const restored = await context.request.get(path);
  expect(restored.status()).toBe(200);
  expect(restored.headers()["cache-control"]).toContain("no-store");
  expect((await restored.json()).form.response_count).toBe(1);
  const summary = (await (
    await context.request.get(`${path}/summary`)
  ).json()) as Schemas["FormSummary"];
  expect(summary.questions[0].mean).toBe(0);
  expect(summary.questions[0].answered_count).toBe(1);
  await context.request.delete(path, {
    headers: { Origin: "http://localhost:13000" },
  });
  expect((await context.request.get(publicPath)).status()).toBe(404);
});
