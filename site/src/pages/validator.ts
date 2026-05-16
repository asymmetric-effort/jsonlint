import { createElement, useState } from "@asymmetric-effort/specifyjs";

const SAMPLE_JSON = `{
  "name": "jsonlint",
  "version": "1.0.0",
  "keywords": ["json", "lint", "parser"]
}`;

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

export function ValidatorPage() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleValidate() {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setResult({ ok: true, message: "Valid JSON.\n\n" + formatted });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ ok: false, message: msg });
    }
  }

  function handleFormat() {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setResult({ ok: true, message: "Formatted successfully." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ ok: false, message: "Cannot format \u2014 " + msg });
    }
  }

  function handleSort() {
    try {
      const parsed = JSON.parse(input);
      const sorted = sortObject(parsed);
      setInput(JSON.stringify(sorted, null, 2));
      setResult({ ok: true, message: "Keys sorted successfully." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ ok: false, message: "Cannot sort \u2014 " + msg });
    }
  }

  function handleClear() {
    setInput("");
    setResult(null);
  }

  return createElement(
    "div",
    null,
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "JSON Validator"),
      createElement("p", null, "Paste or type JSON below to validate, format, or sort keys."),
    ),
    createElement(
      "div",
      { className: "validator" },
      createElement("textarea", {
        id: "json-input",
        value: input,
        onInput: (e: Event) => setInput((e.target as HTMLTextAreaElement).value),
        placeholder: "Paste JSON here...",
        spellcheck: false,
      }),
      createElement(
        "div",
        { className: "validator-actions" },
        createElement(
          "button",
          { className: "btn btn-primary", onClick: handleValidate, id: "btn-validate" },
          "Validate",
        ),
        createElement("button", { className: "btn", onClick: handleFormat, id: "btn-format" }, "Format"),
        createElement("button", { className: "btn", onClick: handleSort, id: "btn-sort" }, "Sort Keys"),
        createElement("button", { className: "btn", onClick: handleClear, id: "btn-clear" }, "Clear"),
      ),
      result
        ? createElement(
            "div",
            {
              className: `result ${result.ok ? "result-success" : "result-error"}`,
              id: "result",
            },
            result.message,
          )
        : null,
    ),
  );
}
