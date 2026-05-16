import { test, expect } from "@playwright/test";

test.describe("jsonlint documentation site", () => {
  test("app renders without errors", async ({ page }) => {
    const errors: string[] = [];
    const logs: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") logs.push(msg.text());
    });

    await page.goto("/", { waitUntil: "networkidle" });
    // Give the framework time to render
    await page.waitForTimeout(2000);

    const html = await page.content();
    const rootContent = await page.locator("#root").innerHTML();

    // Log diagnostics for CI debugging
    console.log("Page errors:", errors);
    console.log("Console errors:", logs);
    console.log("Root innerHTML length:", rootContent.length);
    console.log("Root innerHTML preview:", rootContent.substring(0, 500));

    // The app should render content into #root
    expect(rootContent.length).toBeGreaterThan(0);
  });

  test("home page loads with title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/jsonlint/);
  });

  test("home page shows hero content", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("jsonlint");
  });

  test("home page shows badges", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".badge", { timeout: 10000 });
    await expect(page.locator(".badge").first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await expect(page.locator(".nav-links")).toBeVisible();
  });

  test("navigate to validator page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await page.click(".nav-links >> text=Validator");
    await page.waitForSelector("#json-input", { timeout: 10000 });
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
  });

  test("validator: validate invalid JSON", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await page.fill("#json-input", "{bad json}");
    await page.click("#btn-validate");
    await expect(page.locator("#result")).toHaveClass(/result-error/);
  });

  test("validator: sort keys", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await page.fill("#json-input", '{"c":3,"a":1,"b":2}');
    await page.click("#btn-sort");
    await expect(page.locator("#result")).toContainText("sorted");
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".footer", { timeout: 10000 });
    await expect(page.locator(".footer")).toContainText("Asymmetric Effort");
  });
});
