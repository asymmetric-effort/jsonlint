import { createElement, Router, Route, Link } from "@asymmetric-effort/specifyjs";
import { createRoot } from "@asymmetric-effort/specifyjs/dom";
import { HomePage } from "./pages/home.js";
import { ApiPage } from "./pages/api.js";
import { CliPage } from "./pages/cli.js";
import { ValidatorPage } from "./pages/validator.js";

/**
 * Lightweight SPA router using hash-based navigation.
 * Uses SpecifyJS createElement for component definitions but
 * renders via a thin DOM adapter for maximum compatibility.
 */

type PageComponent = () => string;

const pages: Record<string, PageComponent> = {
  "/": HomePage,
  "/validator": ValidatorPage,
  "/cli": CliPage,
  "/api": ApiPage,
};

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
  return `<footer class="footer">
    <p>MIT License. Copyright \u00A9 2026
      <a href="https://github.com/asymmetric-effort" target="_blank" rel="noopener">Asymmetric Effort, LLC</a>.
    </p>
  </footer>`;
}

function render(): void {
  const path = getPath();
  const root = document.getElementById("root")!;
  const page = Object.prototype.hasOwnProperty.call(pages, path) ? pages[path] : pages["/"];

  root.innerHTML = `
    ${renderNav(path)}
    <main class="main">${page()}</main>
    ${renderFooter()}
  `;

  // Bind validator event handlers if on the validator page
  if (path === "/validator") {
    bindValidatorEvents();
  }
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

// Initial render
render();

// Re-render on hash change
window.addEventListener("hashchange", render);
