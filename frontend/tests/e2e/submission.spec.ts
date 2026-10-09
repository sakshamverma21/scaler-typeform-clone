import { test, expect } from "@playwright/test";
test("publish, anonymous submission, historical results, summary and closure", async ({
  page,
  browser,
}) => {
  await page.goto("/forms");
  await expect(page.getByTestId("form-card")).toHaveCount(3);
  const origin = { Origin: "http://localhost:13000" };
  const created = await page.request.post("/api/v1/creator/forms", {
    headers: origin,
    data: { title: "Submission smoke" },
  });
  expect(created.ok()).toBe(true);
  const data = await created.json();
  const id = data.form.id;
  const key = crypto.randomUUID();
  const saved = await page.request.put(`/api/v1/creator/forms/${id}/draft`, {
    headers: { ...origin, "If-Match": `"${data.form.draft_revision}"` },
    data: {
      mutation_id: crypto.randomUUID(),
      definition: {
        ...data.definition,
        title: "Submission smoke",
        questions: [
          {
            question_key: key,
            type: "short_text",
            title: "Your feedback",
            description: "",
            required: true,
            options: [],
          },
        ],
      },
    },
  });
  expect(saved.ok()).toBe(true);
  await page.goto(`/forms/${id}/share`);
  await page.getByRole("button", { name: "Publish form", exact: true }).click();
  await expect(
    page.getByText("Your form is live", { exact: true }),
  ).toBeVisible();
  const url = await page.getByLabel("Public link").inputValue();
  const stranger = await browser.newContext();
  try {
    const respondent = await stranger.newPage();
    await respondent.goto(url);
    await expect(
      respondent.getByRole("heading", { name: "Your feedback" }),
    ).toBeVisible();
    await respondent
      .getByRole("button", { name: "Submit", exact: true })
      .click();
    await expect(
      respondent.getByText("Please fill this in.", { exact: true }),
    ).toBeVisible();
    await respondent.getByRole("textbox").fill("It works from another browser");
    await respondent
      .getByRole("button", { name: "Submit", exact: true })
      .click();
    await expect(
      respondent.getByRole("heading", { name: "Thank you!" }),
    ).toBeVisible();
    await page.goto(`/forms/${id}/results`);
    await expect(
      page.getByText("It works from another browser", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^View response/ }).click();
    await expect(page.getByRole("dialog")).toContainText("Your feedback");
    await expect(page.getByRole("dialog")).toContainText(
      "It works from another browser",
    );
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Response summary", exact: true })
      .click();
    await expect(
      page.getByText("1 answered · 0 skipped", { exact: true }),
    ).toBeVisible();
    await page.goto(`/forms/${id}/share`);
    await page
      .getByRole("button", { name: "Unpublish form", exact: true })
      .click();
    await page.getByRole("button", { name: "Close form", exact: true }).click();
    await expect(
      page.getByText("Your form is closed", { exact: true }),
    ).toBeVisible();
    await respondent.reload();
    await expect(
      respondent.getByRole("heading", { name: "This form isn’t available" }),
    ).toBeVisible();
  } finally {
    await stranger.close();
  }
});
