import { test, expect } from "@playwright/test";

test.describe("jsonlint documentation site", () => {
  test("home page loads with title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/jsonlint/);
  });

  test("home page shows hero content", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/", { waitUntil: "networkidle" });
    // Wait for SpecifyJS to render
    await page.waitForSelector("h1", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("jsonlint");
    await expect(page.locator(".hero p")).toContainText("zero-dependency");
    expect(errors).toHaveLength(0);
  });

  test("home page shows badges", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".badge", { timeout: 10000 });
    await expect(page.locator(".badge").first()).toBeVisible();
  });

  test("home page shows installation section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("h2", { timeout: 10000 });
    await expect(page.locator("text=Installation")).toBeVisible();
    await expect(page.locator("text=npm install")).toBeVisible();
  });

  test("home page shows features table", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("table", { timeout: 10000 });
    await expect(page.locator("text=Strict JSON Parsing")).toBeVisible();
    await expect(page.locator("text=Zero Dependencies")).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await expect(page.locator(".nav-links")).toBeVisible();
    await expect(page.locator(".nav-links >> text=Validator")).toBeVisible();
    await expect(page.locator(".nav-links >> text=CLI")).toBeVisible();
    await expect(page.locator(".nav-links >> text=API")).toBeVisible();
  });

  test("navigate to validator page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await page.click(".nav-links >> text=Validator");
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await expect(page.locator("h2")).toContainText("JSON Validator");
    await expect(page.locator("#json-input")).toBeVisible();
  });

  test("navigate to CLI page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await page.click(".nav-links >> text=CLI");
    await page.waitForSelector("h2", { timeout: 10000 });
    await expect(page.locator("h2").first()).toContainText("CLI Reference");
  });

  test("navigate to API page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await page.click(".nav-links >> text=API");
    await page.waitForSelector("h2", { timeout: 10000 });
    await expect(page.locator("h2").first()).toContainText("Module API");
  });

  test("validator: validate valid JSON", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await page.fill("#json-input", '{"key": "value"}');
    await page.click("#btn-validate");
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result")).toHaveClass(/result-success/);
    await expect(page.locator("#result")).toContainText("Valid JSON");
  });

  test("validator: validate invalid JSON", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await page.fill("#json-input", "{bad json}");
    await page.click("#btn-validate");
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result")).toHaveClass(/result-error/);
  });

  test("validator: format JSON", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await page.fill("#json-input", '{"b":2,"a":1}');
    await page.click("#btn-format");
    await expect(page.locator("#result")).toContainText("Formatted");
  });

  test("validator: sort keys", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await page.fill("#json-input", '{"c":3,"a":1,"b":2}');
    await page.click("#btn-sort");
    await expect(page.locator("#result")).toContainText("sorted");
  });

  test("validator: clear", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#btn-clear", { timeout: 10000 });
    await page.click("#btn-clear");
    const value = await page.locator("#json-input").inputValue();
    expect(value).toBe("");
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".footer", { timeout: 10000 });
    await expect(page.locator(".footer")).toBeVisible();
    await expect(page.locator(".footer")).toContainText("Asymmetric Effort");
  });
});
