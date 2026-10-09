import { test, expect } from "@playwright/test";
test("direct creation opens the full question picker and persists an added question", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1917, height: 871 });
  await page.goto("/forms");
  await expect(page.getByTestId("form-card")).toHaveCount(3);
  await page.screenshot({
    path: info.outputPath("workspace.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Create a form", exact: true })
    .click();
  await expect(page).toHaveURL(/build\?new=1/);
  const picker = page.getByRole("dialog", { name: "Add form elements" });
  await expect(picker).toBeVisible();
  await expect(picker.getByLabel("Search question types")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("question-picker.png"),
    fullPage: true,
  });
  await picker.getByRole("button", { name: "Short text", exact: true }).click();
  await expect(picker).not.toBeVisible();
  await expect(page.getByTestId("save-status")).toContainText("Saved");
  const id = new URL(page.url()).pathname.split("/")[2];
  await expect
    .poll(
      async () =>
        (await (await page.request.get(`/api/v1/creator/forms/${id}`)).json())
          .draft.questions.length,
    )
    .toBe(1);
});
