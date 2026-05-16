import { HomePage } from "./pages/home.js";
import { ApiPage } from "./pages/api.js";
import { CliPage } from "./pages/cli.js";
import { ValidatorPage } from "./pages/validator.js";

declare const __APP_VERSION__: string;
const VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";

type PageComponent = () => string;

const ROUTES: Record<string, PageComponent> = Object.create(null);
ROUTES["/"] = HomePage;
ROUTES["/validator"] = ValidatorPage;
ROUTES["/cli"] = CliPage;
ROUTES["/api"] = ApiPage;

function getPath(): string {
  const hash = window.location.hash.replace(/^#\/?/, "/");
  return hash === "" ? "/" : hash;
}

function renderNav(currentPath: string): string {
  const links = [
    { to: "/", label: "Home", exact: true },
    { to: "/validator", label: "Validator" },
    { to: "/cli", label: "CLI" },
    { to: "/api", label: "API" },
  ];

  const navLinks = links
    .map((link) => {
      const isActive = link.exact ? currentPath === link.to : currentPath.startsWith(link.to);
      return `<a href="#${link.to}" class="${isActive ? "active" : ""}">${link.label}</a>`;
    })
    .join("");

  return `<nav class="nav">
    <a href="#/" class="nav-brand">jsonlint</a>
    <div class="nav-links">${navLinks}</div>
  </nav>`;
}

function renderFooter(): string {
  return `<footer class="footer" role="contentinfo">
    <div class="footer-inner">
      <span>v${VERSION}</span>
      <span>MIT License \u00A9 2026 Asymmetric Effort, LLC</span>
      <span>
        <a href="https://github.com/asymmetric-effort/jsonlint" target="_blank" rel="noopener noreferrer">GitHub</a>
        \u00B7
        <a href="https://github.com/asymmetric-effort/jsonlint/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">Security</a>
        \u00B7
        <a href="https://github.com/asymmetric-effort/jsonlint/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing</a>
      </span>
    </div>
  </footer>`;
}

function render(): void {
  const path = getPath();
  const root = document.getElementById("root")!;
  const page = path in ROUTES ? ROUTES[path] : ROUTES["/"];

  root.innerHTML = `
    ${renderNav(path)}
    <main class="main">${page()}</main>
    ${renderFooter()}
  `;

  if (path === "/validator") {
    bindValidatorEvents();
  }

  // Client-side SEO: update document head based on current page
  updateHead(path);
}

function updateHead(path: string): void {
  const titles: Record<string, string> = Object.create(null);
  titles["/"] = "jsonlint \u2014 JSON Parser & Validator";
  titles["/validator"] = "JSON Validator \u2014 jsonlint";
  titles["/cli"] = "CLI Reference \u2014 jsonlint";
  titles["/api"] = "API Reference \u2014 jsonlint";

  document.title = path in titles ? titles[path] : titles["/"];

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = `https://jsonlint.asymmetric-effort.com/${path === "/" ? "" : "#" + path}`;
}

function bindValidatorEvents(): void {
  const input = document.getElementById("json-input") as HTMLTextAreaElement;
  const resultDiv = document.getElementById("result-container")!;

  document.getElementById("btn-validate")?.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(input.value);
      const formatted = JSON.stringify(parsed, null, 2);
      resultDiv.innerHTML = `<div class="result result-success" id="result">Valid JSON.\n\n${escapeHtml(formatted)}</div>`;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      resultDiv.innerHTML = `<div class="result result-error" id="result">${escapeHtml(msg)}</div>`;
    }
  });

  document.getElementById("btn-format")?.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(input.value);
      input.value = JSON.stringify(parsed, null, 2);
      resultDiv.innerHTML = `<div class="result result-success" id="result">Formatted successfully.</div>`;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      resultDiv.innerHTML = `<div class="result result-error" id="result">Cannot format \u2014 ${escapeHtml(msg)}</div>`;
    }
  });

  document.getElementById("btn-sort")?.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(input.value);
      const sorted = sortObject(parsed);
      input.value = JSON.stringify(sorted, null, 2);
      resultDiv.innerHTML = `<div class="result result-success" id="result">Keys sorted successfully.</div>`;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      resultDiv.innerHTML = `<div class="result result-error" id="result">Cannot sort \u2014 ${escapeHtml(msg)}</div>`;
    }
  });

  document.getElementById("btn-clear")?.addEventListener("click", () => {
    input.value = "";
    resultDiv.innerHTML = "";
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

render();
window.addEventListener("hashchange", render);
