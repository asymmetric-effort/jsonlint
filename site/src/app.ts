import { createElement, Router, Route, Link, useNavigate } from "@asymmetric-effort/specifyjs";
import { useHead, useState } from "@asymmetric-effort/specifyjs";
import { createRoot } from "@asymmetric-effort/specifyjs/dom";
import { Footer as SpecFooter } from "@asymmetric-effort/specifyjs/components";
import { HomePage } from "./pages/home.js";
import { ApiPage } from "./pages/api.js";
import { CliPage } from "./pages/cli.js";
import { ValidatorPage } from "./pages/validator.js";

declare const __APP_VERSION__: string;
const VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";

function Nav() {
  return createElement(
    "nav",
    { className: "nav" },
    createElement(Link, { to: "/", className: "nav-brand" }, "jsonlint"),
    createElement(
      "div",
      { className: "nav-links" },
      createElement(Link, { to: "/", exact: true, activeClassName: "active" }, "Home"),
      createElement(Link, { to: "/validator", activeClassName: "active" }, "Validator"),
      createElement(Link, { to: "/cli", activeClassName: "active" }, "CLI"),
      createElement(Link, { to: "/api", activeClassName: "active" }, "API"),
    ),
  );
}

function AppFooter() {
  return SpecFooter({
    left: createElement("span", null, `v${VERSION}`),
    center: createElement("span", null, "MIT License \u00A9 2026 Asymmetric Effort, LLC"),
    right: createElement(
      "span",
      null,
      createElement(
        "a",
        {
          href: "https://github.com/asymmetric-effort/jsonlint",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "GitHub",
      ),
      " \u00B7 ",
      createElement(
        "a",
        {
          href: "https://github.com/asymmetric-effort/jsonlint/blob/main/SECURITY.md",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "Security",
      ),
      " \u00B7 ",
      createElement(
        "a",
        {
          href: "https://github.com/asymmetric-effort/jsonlint/blob/main/CONTRIBUTING.md",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "Contributing",
      ),
    ),
    background: "var(--color-surface)",
    color: "var(--color-text-muted)",
    borderTop: "1px solid var(--color-border)",
    fontSize: "0.85rem",
    padding: "1.5rem",
  });
}

function SeoHead() {
  useHead({
    title: "jsonlint \u2014 JSON Parser & Validator",
    description:
      "A zero-dependency JSON parser, linter, and validator with detailed error reporting. Feature-compatible with zaach/jsonlint.",
    keywords: "json, lint, linter, parser, validator, jsonlint, zero-dependency, typescript",
    author: "Asymmetric Effort, LLC",
    canonical: "https://jsonlint.asymmetric-effort.com/",
    og: {
      title: "jsonlint \u2014 JSON Parser & Validator",
      description: "A zero-dependency JSON parser, linter, and validator with detailed error reporting.",
      url: "https://jsonlint.asymmetric-effort.com/",
      type: "website",
    },
  });
  return null;
}

function App() {
  return createElement(
    Router,
    null,
    createElement(SeoHead, null),
    createElement(Nav, null),
    createElement(
      "main",
      { className: "main" },
      createElement(Route, { path: "/", exact: true, component: HomePage }),
      createElement(Route, { path: "/validator", component: ValidatorPage }),
      createElement(Route, { path: "/cli", component: CliPage }),
      createElement(Route, { path: "/api", component: ApiPage }),
    ),
    createElement(AppFooter, null),
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(createElement(App, null));
