import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

const VERSION = readFileSync(resolve(import.meta.dirname, "../../../VERSION"), "utf-8").trim();

test.describe("Site Deployment Verification", () => {
  test("homepage returns 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("page has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/jsonlint/);
  });

  test("page has meta description", async ({ page }) => {
    await page.goto("/");
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toContain("JSON");
  });
});

test.describe("Noscript Fallback Verification", () => {
  test("noscript contains project name", async ({ page }) => {
    await page.goto("/");
    const noscript = await page.locator("noscript").innerHTML();
    expect(noscript).toContain("jsonlint");
  });

  test("noscript contains navigation sections", async ({ page }) => {
    await page.goto("/");
    const noscript = await page.locator("noscript").innerHTML();
    expect(noscript).toContain("Installation");
    expect(noscript).toContain("CLI Usage");
    expect(noscript).toContain("API");
  });

  test("noscript contains install command", async ({ page }) => {
    await page.goto("/");
    const noscript = await page.locator("noscript").innerHTML();
    expect(noscript).toContain("npm install @asymmetric-effort/jsonlint");
  });
});

test.describe("SPA Rendering Verification", () => {
  test("content renders into #root", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const rootContent = await page.locator("#root").innerHTML();
    expect(rootContent.length).toBeGreaterThan(0);
  });

  test("hero section visible with project name", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("jsonlint");
  });

  test("navigation links present", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await expect(page.locator(".nav-links")).toBeVisible();
  });

  test("hash navigation works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector(".nav-links", { timeout: 10000 });
    await page.click(".nav-links >> text=CLI");
    await page.waitForSelector("h2", { timeout: 10000 });
    await expect(page.locator("h2").first()).toContainText("CLI Reference");
  });
});

test.describe("SEO Verification", () => {
  test("sitemap.xml exists and has URLs", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<url>");
    expect(body).toContain("<loc>");
  });

  test("robots.txt exists with User-agent and Sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-agent:");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap:");
  });

  test("llms.txt exists with project info", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("jsonlint");
    expect(body).toContain("npm install");
  });

  test("JSON-LD structured data present", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeTruthy();
    const data = JSON.parse(jsonLd!);
    expect(data["@type"]).toBe("SoftwareSourceCode");
    expect(data.name).toContain("jsonlint");
  });

  test("favicon exists", async ({ request }) => {
    const response = await request.get("/favicon.ico");
    expect(response.status()).toBe(200);
  });
});

test.describe("Footer Verification", () => {
  test("footer element exists", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("#root footer", { timeout: 10000 });
    await expect(page.locator("#root footer")).toBeVisible();
  });

  test("footer contains version in semver format", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("#root footer", { timeout: 10000 });
    const footerText = await page.locator("#root footer").innerText();
    expect(footerText).toMatch(/v\d+\.\d+\.\d+/);
  });

  test("footer version matches VERSION file", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("#root footer", { timeout: 10000 });
    const footerText = await page.locator("#root footer").innerText();
    expect(footerText, `Footer should contain version v${VERSION}`).toContain(`v${VERSION}`);
  });

  test("footer contains Asymmetric Effort", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("#root footer", { timeout: 10000 });
    const footerText = await page.locator("#root footer").innerText();
    expect(footerText).toContain("Asymmetric Effort");
  });

  test("footer contains GitHub link", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("#root footer", { timeout: 10000 });
    const githubLink = page.locator('#root footer a[href="https://github.com/asymmetric-effort/jsonlint"]');
    await expect(githubLink).toBeVisible();
  });
});

test.describe("Validator Page", () => {
  test("validator textarea visible", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await expect(page.locator("#json-input")).toBeVisible();
  });

  test("validate button works", async ({ page }) => {
    await page.goto("/#/validator", { waitUntil: "networkidle" });
    await page.waitForSelector("#json-input", { timeout: 10000 });
    await page.fill("#json-input", '{"key": "value"}');
    await page.click("#btn-validate");
    await expect(page.locator("#result")).toHaveClass(/result-success/);
  });
});
