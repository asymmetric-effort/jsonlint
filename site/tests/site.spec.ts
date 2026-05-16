import { test, expect } from "@playwright/test";

test.describe("jsonlint documentation site", () => {
  test("home page loads with title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/jsonlint/);
  });

  test("home page shows hero content", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("jsonlint");
    await expect(page.locator(".hero p")).toContainText("zero-dependency");
  });

  test("home page shows badges", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".badge").first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".nav-links")).toBeVisible();
  });

  test("navigate to validator page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.click(".nav-links >> text=Validator");
    await expect(page.locator("#json-input")).toBeVisible();
  });

  test("navigate to CLI page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.click(".nav-links >> text=CLI");
    await expect(page.locator("h2").first()).toContainText("CLI Reference");
  });

  test("navigate to API page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.click(".nav-links >> text=API");
    await expect(page.locator("h2").first()).toContainText("Module API");
  });

  test("validator: validate valid JSON", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.fill("#json-input", '{"key": "value"}');
    await page.click("#btn-validate");
    await expect(page.locator("#result")).toHaveClass(/result-success/);
  });

  test("validator: validate invalid JSON", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.fill("#json-input", "{bad json}");
    await page.click("#btn-validate");
    await expect(page.locator("#result")).toHaveClass(/result-error/);
  });

  test("validator: sort keys", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.fill("#json-input", '{"c":3,"a":1,"b":2}');
    await page.click("#btn-sort");
    await expect(page.locator("#result")).toContainText("sorted");
  });

  test("validator: clear", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.click("#btn-clear");
    const value = await page.locator("#json-input").inputValue();
    expect(value).toBe("");
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".footer")).toBeVisible();
    await expect(page.locator(".footer")).toContainText("Asymmetric Effort");
  });
});
