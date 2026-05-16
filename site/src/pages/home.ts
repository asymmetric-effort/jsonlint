import { createElement } from "@asymmetric-effort/specifyjs";

export function HomePage() {
  return createElement(
    "div",
    null,
    createElement(
      "div",
      { className: "hero" },
      createElement("h1", null, "@asymmetric-effort/jsonlint"),
      createElement(
        "p",
        null,
        "A zero-dependency JSON parser, linter, and validator with detailed error reporting. Feature-compatible with zaach/jsonlint.",
      ),
      createElement(
        "div",
        { className: "hero-badges" },
        createElement("span", { className: "badge badge-primary" }, "Zero Dependencies"),
        createElement("span", { className: "badge" }, "TypeScript"),
        createElement("span", { className: "badge" }, "MIT License"),
        createElement("span", { className: "badge" }, "100% Line Coverage"),
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "Installation"),
      createElement("pre", null, createElement("code", null, "npm install @asymmetric-effort/jsonlint")),
      createElement("p", null, "Or install globally for CLI usage:"),
      createElement("pre", null, createElement("code", null, "npm install -g @asymmetric-effort/jsonlint")),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "Quick Start"),
      createElement("h3", null, "Module API"),
      createElement(
        "pre",
        null,
        createElement(
          "code",
          null,
          `import { parse } from "@asymmetric-effort/jsonlint";

const result = parse('{"key": "value"}');
// Returns: { key: "value" }`,
        ),
      ),
      createElement("h3", null, "CLI"),
      createElement(
        "pre",
        null,
        createElement(
          "code",
          null,
          `# Validate a file
jsonlint data.json

# Sort keys and format in place
jsonlint -s -i data.json

# Validate against a JSON Schema
jsonlint -V schema.json data.json`,
        ),
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "Features"),
      createElement(
        "table",
        null,
        createElement(
          "thead",
          null,
          createElement(
            "tr",
            null,
            createElement("th", null, "Feature"),
            createElement("th", null, "Description"),
          ),
        ),
        createElement(
          "tbody",
          null,
          ...[
            ["Strict JSON Parsing", "ECMA-262 / RFC 7159 compliant recursive descent parser"],
            ["Detailed Errors", "Line/column tracking with visual position indicators"],
            ["JSON Schema", "Built-in Draft-03 schema validation"],
            ["Formatter", "Character-by-character formatter that works on invalid JSON"],
            ["CLI Tool", "Full-featured command-line interface with all standard flags"],
            ["Standalone Binary", "Compiled standalone executable via Bun"],
            ["Zero Dependencies", "No runtime dependencies \u2014 everything built from scratch"],
          ].map(([feature, desc]) =>
            createElement(
              "tr",
              { key: feature },
              createElement("td", null, createElement("strong", null, feature)),
              createElement("td", null, desc),
            ),
          ),
        ),
      ),
    ),
  );
}
