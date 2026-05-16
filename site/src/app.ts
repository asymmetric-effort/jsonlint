import { createElement, Router, Route, Link } from "@asymmetric-effort/specifyjs";
import { createRoot } from "@asymmetric-effort/specifyjs/dom";
import { HomePage } from "./pages/home.js";
import { ApiPage } from "./pages/api.js";
import { CliPage } from "./pages/cli.js";
import { ValidatorPage } from "./pages/validator.js";

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

function Footer() {
  return createElement(
    "footer",
    { className: "footer" },
    createElement(
      "p",
      null,
      "MIT License. Copyright \u00A9 2026 ",
      createElement(
        "a",
        { href: "https://github.com/asymmetric-effort", target: "_blank", rel: "noopener" },
        "Asymmetric Effort, LLC",
      ),
      ".",
    ),
  );
}

function App() {
  return createElement(
    Router,
    null,
    createElement(Nav, null),
    createElement(
      "main",
      { className: "main" },
      createElement(Route, { path: "/", exact: true, component: HomePage }),
      createElement(Route, { path: "/validator", component: ValidatorPage }),
      createElement(Route, { path: "/cli", component: CliPage }),
      createElement(Route, { path: "/api", component: ApiPage }),
    ),
    createElement(Footer, null),
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(createElement(App, null));
