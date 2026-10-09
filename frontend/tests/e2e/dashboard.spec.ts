import { expect, test } from "@playwright/test";

test("workspace CRUD, persistence, safe cancellation and mobile layout", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/forms");
  const cards = page.getByTestId("form-card");
  await expect(cards).toHaveCount(3);
  await expect(
    cards.filter({ hasText: "Sample: Product feedback" }),
  ).toContainText("12 sample");
  await page.screenshot({
    path: testInfo.outputPath("dashboard-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Grid view" }).click();
  await expect(page.getByRole("button", { name: "Grid view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "List view" }).click();

  // One failure injection proves errors preserve the entered title and never claim success.
  let failCreate = true;
  await page.route("**/api/v1/creator/forms", (route) => {
    if (route.request().method() === "POST" && failCreate) {
      failCreate = false;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"code":"database_unavailable","message":"Please try again in a moment."}',
      });
    }
    return route.continue();
  });
  await page
    .getByRole("button", { name: "Create a form", exact: true })
    .click();
  await expect(
    page.getByText("Please try again in a moment.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create a form", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Add form elements" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("Form name").fill("Launch feedback");
  await expect(page.getByTestId("save-status")).toContainText("Saved");
  const dialog = page.getByRole("dialog");
  await page.getByRole("link", { name: "Back to forms" }).click();
  await expect(cards).toHaveCount(4);

  async function action(title: string, name: string) {
    await page
      .getByRole("button", { name: `Actions for ${title}`, exact: true })
      .click();
    await page.getByRole("menuitem", { name, exact: true }).click();
  }
  await action("Launch feedback", "Rename");
  await dialog.getByLabel("Form name").fill("Renamed feedback");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Renamed feedback", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(cards).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: "Renamed feedback", exact: true }),
  ).toBeVisible();
  await action("Renamed feedback", "Duplicate");
  await expect(
    page.getByRole("link", { name: "Renamed feedback (copy)", exact: true }),
  ).toBeVisible();
  await expect(
    cards.filter({ hasText: "Renamed feedback (copy)" }),
  ).toContainText("Draft");
  await action("Renamed feedback (copy)", "Rename");
  await dialog.getByLabel("Form name").fill("Independent copy");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Independent copy", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Renamed feedback", exact: true }),
  ).toBeVisible();
  await action("Renamed feedback", "Delete");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("button", {
      name: "Actions for Renamed feedback",
      exact: true,
    }),
  ).toBeFocused();
  await expect(cards).toHaveCount(5);
  await page.getByLabel("Search forms").fill("Independent copy");
  await expect(cards).toHaveCount(1);
  await page.getByLabel("Search forms").fill("");
  await expect(cards).toHaveCount(5);
  while (await cards.count()) {
    const count = await cards.count();
    await cards
      .first()
      .getByRole("button", { name: /^Actions for/ })
      .click();
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    await dialog
      .getByRole("button", { name: "Delete form", exact: true })
      .click();
    await expect(cards).toHaveCount(count - 1);
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your next idea starts here" }),
  ).toBeVisible();
  await expect(cards).toHaveCount(0);
});

test("bootstrap failure recovery, browser isolation and session expiry", async ({
  page,
  context,
  browser,
}) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/creator/session", async (route) => {
    await pending;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"code":"database_unavailable","message":"Please try again in a moment."}',
    });
  });
  await page.goto("/forms");
  await expect(
    page.getByRole("status", { name: "Loading forms" }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "We couldn’t open your workspace" }),
  ).toBeVisible();
  await page.unroute("**/api/v1/creator/session");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByTestId("form-card")).toHaveCount(3);
  const originalCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "typeform_creator",
  )?.value;
  const href = await page
    .getByRole("link", { name: "Sample: Product feedback", exact: true })
    .getAttribute("href");
  const formId = href?.split("/")[2];
  const stranger = await browser.newContext();
  try {
    const other = await stranger.newPage();
    await other.goto("http://localhost:13000/forms");
    await expect(other.getByTestId("form-card")).toHaveCount(3);
    expect(
      (
        await stranger.request.get(
          `http://localhost:13000/api/v1/creator/forms/${formId}`,
        )
      ).status(),
    ).toBe(404);
  } finally {
    await stranger.close();
  }
  await context.clearCookies();
  await page
    .getByRole("button", {
      name: "Actions for Sample: Product feedback",
      exact: true,
    })
    .click();
  await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
  await page.getByLabel("Form name").fill("Expired edit");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByTestId("form-card")).toHaveCount(3);
  await expect
    .poll(async () => {
      const currentCookie = (await context.cookies()).find(
        (cookie) => cookie.name === "typeform_creator",
      )?.value;
      return !!currentCookie && currentCookie !== originalCookie;
    })
    .toBe(true);
  await expect(
    page.getByRole("link", { name: "Expired edit", exact: true }),
  ).toHaveCount(0);
});
