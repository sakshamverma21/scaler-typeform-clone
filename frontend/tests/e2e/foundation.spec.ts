import { test, expect } from "@playwright/test";

test("browser cookie survives reload through the real Next.js rewrite", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "My workspace", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("connection-status")).toContainText(
    "Connected",
  );
  const health = await page.request.get("/api/v1/health/ready");
  expect(health.status()).toBe(200);
  expect(health.headers()["cache-control"]).toContain("no-store");
  await page
    .getByRole("button", { name: "Connection check", exact: true })
    .click();
  await page.getByRole("button", { name: "Run check" }).click();
  await expect(page.getByText("Cookie and storage verified")).toBeVisible();
  const id = await page.getByTestId("probe-id").innerText();
  const cookie = (await context.cookies()).find(
    (item) => item.name === "typeform_foundation",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.domain).toBe("localhost");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("button", { name: "Connection check", exact: true }),
  ).toBeFocused();
  await page.reload();
  await page
    .getByRole("button", { name: "Connection check", exact: true })
    .click();
  await page.getByRole("button", { name: "Run check" }).click();
  await expect(page.getByTestId("probe-id")).toHaveText(id);
});

for (const width of [360, 390, 768, 1280, 1440]) {
  test(`workspace and dialog remain usable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/forms");
    await expect(
      page.getByRole("heading", { name: "My workspace", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("connection-status")).toContainText(
      "Connected",
    );
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: testInfo.outputPath(`workspace-${width}.png`),
        fullPage: true,
      });
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Connection check", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    for (let index = 0; index < 3; index++) {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("dialog").locator(":focus")).toHaveCount(1);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
}

test("connection failure has visible retry and recovers", async ({ page }) => {
  await page.route("**/api/v1/health/ready", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"code":"not_ready","message":"Please retry."}',
    }),
  );
  await page.goto("/forms");
  await expect(page.getByText("Connection unavailable")).toBeVisible();
  await page.unroute("**/api/v1/health/ready");
  await page.getByRole("button", { name: "Retry connection" }).click();
  await expect(page.getByTestId("connection-status")).toContainText(
    "Connected",
  );
});

test("public unavailable page has no creator navigation", async ({ page }) => {
  await page.goto("/to/not-published");
  await expect(
    page.getByRole("heading", { name: "This form isn’t available" }),
  ).toBeVisible();
  await expect(page.getByRole("complementary")).toHaveCount(0);
});

test("slow readiness keeps the workspace visible and announces loading", async ({
  page,
}) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/health/ready", async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto("/forms");
  await expect(
    page.getByRole("heading", { name: "My workspace", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("connection-status")).toContainText(
    "Connecting",
  );
  release();
  await expect(page.getByTestId("connection-status")).toContainText(
    "Connected",
  );
});
