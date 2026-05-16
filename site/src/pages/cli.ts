import { createElement } from "@asymmetric-effort/specifyjs";

export function CliPage() {
  const options = [
    ["-v", "--version", "Print version and exit"],
    ["-s", "--sort-keys", "Sort object keys in output"],
    ["-i", "--in-place", "Overwrite input file with formatted output"],
    ["-t CHAR", "--indent CHAR", "Indentation characters (default: 2 spaces)"],
    ["-c", "--compact", "Compact error display format"],
    ["-V FILE", "--validate FILE", "Validate against a JSON Schema (Draft-03)"],
    ["-e ENV", "--environment ENV", "JSON Schema spec version"],
    ["-q", "--quiet", "Suppress JSON output to stdout"],
    ["-p", "--pretty-print", "Force pretty printing even if invalid"],
    ["-h", "--help", "Show help message"],
  ];

  return createElement(
    "div",
    null,
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "CLI Reference"),
      createElement(
        "p",
        null,
        "The jsonlint command-line tool validates, formats, and optionally transforms JSON files.",
      ),
      createElement("pre", null, createElement("code", null, "jsonlint [OPTIONS] [FILE]")),
      createElement("p", null, "If FILE is omitted, reads from stdin."),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "Options"),
      createElement(
        "table",
        null,
        createElement(
          "thead",
          null,
          createElement(
            "tr",
            null,
            createElement("th", null, "Flag"),
            createElement("th", null, "Long Form"),
            createElement("th", null, "Description"),
          ),
        ),
        createElement(
          "tbody",
          null,
          ...options.map(([flag, long, desc]) =>
            createElement(
              "tr",
              { key: flag },
              createElement("td", null, createElement("code", null, flag)),
              createElement("td", null, createElement("code", null, long)),
              createElement("td", null, desc),
            ),
          ),
        ),
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "Examples"),
      createElement("h3", null, "Validate and pretty-print"),
      createElement("pre", null, createElement("code", null, "jsonlint data.json")),
      createElement("h3", null, "Sort keys"),
      createElement("pre", null, createElement("code", null, "jsonlint -s data.json")),
      createElement("h3", null, "Format in place"),
      createElement("pre", null, createElement("code", null, "jsonlint -i data.json")),
      createElement("h3", null, "Validate against a schema"),
      createElement("pre", null, createElement("code", null, "jsonlint -V schema.json data.json")),
      createElement("h3", null, "Compact errors (for editor integration)"),
      createElement(
        "pre",
        null,
        createElement(
          "code",
          null,
          `$ jsonlint -c bad.json
bad.json: line 2, col 5, found: '}' - expected: 'STRING'.`,
        ),
      ),
      createElement("h3", null, "Read from stdin"),
      createElement("pre", null, createElement("code", null, "echo '{\"key\": \"value\"}' | jsonlint -q")),
    ),
  );
}
