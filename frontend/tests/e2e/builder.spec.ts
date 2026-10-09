import { expect, test } from "@playwright/test";

test("eight-type editing, drag order, reload and zero-write interactive preview", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/forms");
  await expect(page.getByTestId("form-card")).toHaveCount(3);
  const created = await (
    await page.request.post("/api/v1/creator/forms", {
      data: { title: "Builder smoke" },
      headers: { Origin: "http://localhost:13000" },
    })
  ).json();
  const id = created.form.id;
  await page.goto(`/forms/${id}/build`);
  const types = [
    "Short text",
    "Long text",
    "Multiple choice",
    "Dropdown",
    "Email",
    "Number",
    "Yes / No",
    "Rating",
  ];
  for (let i = 0; i < types.length; i++) {
    await page
      .getByRole("button", { name: "Add content", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: types[i], exact: true })
      .click();
    await page
      .getByLabel("Question prompt", { exact: true })
      .fill(`Prompt ${i + 1}`);
    await page.getByLabel("Required", { exact: true }).check();
    if (!i)
      await page.getByLabel("Question description").fill("Helpful description");
    if (i === 2) {
      await page.getByLabel("Choice 1", { exact: true }).fill("Alpha");
      await page.getByLabel("Choice 2", { exact: true }).fill("Beta");
    }
    if (i === 7) await page.getByLabel("Rating scale").selectOption("7");
  }
  await expect(page.getByTestId("question-row")).toHaveCount(8);
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  const source = await page
    .getByRole("button", { name: "Reorder question 8", exact: true })
    .boundingBox();
  const target = await page
    .getByRole("button", { name: "Reorder question 1", exact: true })
    .boundingBox();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(source!.x + source!.width / 2, source!.y - 20, {
    steps: 5,
  });
  await page.mouse.move(target!.x + target!.width / 2, target!.y + 5, {
    steps: 20,
  });
  await page.mouse.up();
  await expect(page.getByTestId("question-row").first()).toContainText(
    "Prompt 8",
  );
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  await page
    .getByRole("button", { name: "Duplicate question", exact: true })
    .click();
  await expect(page.getByTestId("question-row")).toHaveCount(9);
  await page
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Cancel" }),
  ).toBeFocused();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  await expect(page.getByTestId("question-row")).toHaveCount(9);
  await page
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await page.getByLabel("Form name", { exact: true }).fill("Saved builder");
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  await page.reload();
  await expect(page.getByLabel("Form name")).toHaveValue("Saved builder");
  await expect(page.getByTestId("question-row")).toHaveCount(8);
  await expect(page.getByTestId("question-row").first()).toContainText(
    "Prompt 8",
  );
  await expect(page.getByLabel("Rating scale")).toHaveValue("7");
  const handle = page.getByRole("button", {
    name: "Reorder question 1",
    exact: true,
  });
  await handle.focus();
  await handle.press("Space");
  await handle.press("ArrowDown");
  await handle.press("Escape");
  await expect(page.getByTestId("question-row").first()).toContainText(
    "Prompt 8",
  );
  await page
    .getByRole("button", { name: "Move question down", exact: true })
    .press("Enter");
  await expect(page.getByTestId("question-row").nth(1)).toContainText(
    "Prompt 8",
  );
  await page
    .getByRole("button", { name: "Move question up", exact: true })
    .press("Enter");
  await expect(page.getByTestId("question-row").first()).toContainText(
    "Prompt 8",
  );
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  await page.screenshot({
    path: info.outputPath("builder-desktop.png"),
    fullPage: true,
  });
  let responseWrites = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/responses(?:\?|$)/.test(request.url())
    )
      responseWrites++;
  });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText("Please fill this in.");
  await dialog.getByRole("radio", { name: "4 stars" }).click();
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /^Prompt 1/ }),
  ).toBeVisible();
  await expect(dialog).toContainText("Helpful description");
  await dialog.getByLabel("Your answer", { exact: true }).fill("Ada");
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /^Prompt 2/ }),
  ).toBeVisible();
  await dialog
    .getByLabel("Your answer", { exact: true })
    .fill("First line\nSecond line");
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /^Prompt 3/ }),
  ).toBeVisible();
  await dialog.getByRole("radio", { name: "A Alpha" }).click();
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /^Prompt 4/ }),
  ).toBeVisible();
  const dropdown = dialog.getByRole("combobox", { name: "Your answer" });
  await dropdown.fill("missing");
  await expect(dialog).toContainText("No matching choices");
  await dropdown.press("Escape");
  await dropdown.fill("Choice 2");
  await dialog.getByRole("option", { name: "Choice 2", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /^Prompt 5/ }),
  ).toBeVisible();
  await dialog.getByLabel("Your answer", { exact: true }).fill("invalid");
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("valid email");
  await dialog
    .getByLabel("Your answer", { exact: true })
    .fill("ada@example.com");
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /^Prompt 6/ }),
  ).toBeVisible();
  await dialog.getByLabel("Your answer", { exact: true }).fill("0");
  await dialog
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: /^Prompt 7/ }),
  ).toBeVisible();
  await dialog.getByRole("radio", { name: "N No", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Finish preview", exact: true })
    .first()
    .click();
  await expect(dialog).toContainText(
    "Preview complete. No response was collected.",
  );
  expect(responseWrites).toBe(0);
  const saved = await (
    await page.request.get(`/api/v1/creator/forms/${id}`)
  ).json();
  expect(saved.form.response_count).toBe(0);
  expect(saved.draft.questions.map((q: { type: string }) => q.type)).toEqual([
    "rating",
    "short_text",
    "long_text",
    "multiple_choice",
    "dropdown",
    "email",
    "number",
    "yes_no",
  ]);
  await dialog.getByRole("button", { name: "Open saved preview page" }).click();
  await expect(page).toHaveURL(new RegExp(`/forms/${id}/preview$`));
  await expect(
    page.getByRole("heading", { name: "Form preview", exact: true }),
  ).toBeVisible();
});

test("failed-save retry, stale-tab protection, mobile settings and empty builder", async ({
  page,
}, info) => {
  await page.goto("/forms");
  await expect(page.getByTestId("form-card")).toHaveCount(3);
  const created = await (
    await page.request.post("/api/v1/creator/forms", {
      data: { title: "Save recovery" },
      headers: { Origin: "http://localhost:13000" },
    })
  ).json();
  const id = created.form.id;
  await page.goto(`/forms/${id}/build`);
  await page.getByRole("button", { name: "Add content", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Short text", exact: true })
    .click();
  await page.getByLabel("Question prompt").fill("Original prompt");
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  let fail = true;
  await page.route(`**/creator/forms/${id}/draft`, (route) => {
    if (fail) {
      fail = false;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"code":"database_unavailable","message":"Retry later."}',
      });
    }
    return route.continue();
  });
  await page.getByLabel("Question prompt").fill("Retained edit");
  await expect(page.getByTestId("save-status")).toHaveText("Save failed");
  await expect(page.getByLabel("Question prompt")).toHaveValue("Retained edit");
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  fail = true;
  await page.getByLabel("Question prompt").fill("Recovered after reload");
  await expect(page.getByTestId("save-status")).toHaveText("Save failed");
  await page.reload();
  await page
    .getByRole("button", { name: "Restore local draft", exact: true })
    .click();
  await expect(page.getByLabel("Question prompt")).toHaveValue(
    "Recovered after reload",
  );
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  const otherTab = await page.context().newPage();
  await otherTab.goto(`/forms/${id}/build`);
  await expect(otherTab.getByLabel("Question prompt")).toHaveValue(
    "Recovered after reload",
  );
  await otherTab.getByLabel("Question prompt").fill("Newer tab edit");
  await expect(otherTab.getByTestId("save-status")).toHaveText("Saved");
  await page.getByLabel("Question prompt").fill("Stale local edit");
  await expect(page.getByTestId("save-status")).toHaveText("Conflict");
  await expect(page.getByLabel("Question prompt")).toHaveValue(
    "Stale local edit",
  );
  expect(
    (await (await page.request.get(`/api/v1/creator/forms/${id}`)).json()).draft
      .questions[0].title,
  ).toBe("Newer tab edit");
  await page
    .getByRole("button", { name: "Reload saved version", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Discard and reload", exact: true })
    .click();
  await expect(page.getByLabel("Question prompt")).toHaveValue(
    "Newer tab edit",
  );
  await otherTab.close();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Required", { exact: true })
    .check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close dialog" })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("builder-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Let’s start a conversation" }),
  ).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveText("Saved");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Let’s start a conversation" }),
  ).toBeVisible();
});
