import { createElement } from "@asymmetric-effort/specifyjs";

export function ApiPage() {
  return createElement(
    "div",
    null,
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "Module API"),
      createElement(
        "p",
        null,
        "Import from ",
        createElement("code", null, "@asymmetric-effort/jsonlint"),
        " to use the parser, formatter, and schema validator programmatically.",
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "parse(input)"),
      createElement("p", null, "Parse a JSON string. Returns the parsed value or throws a ParseError."),
      createElement(
        "pre",
        null,
        createElement(
          "code",
          null,
          `import { parse } from "@asymmetric-effort/jsonlint";

const result = parse('{"key": "value"}');
// { key: "value" }`,
        ),
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "JsonParser"),
      createElement("p", null, "For advanced usage, instantiate a parser with a custom error handler."),
      createElement(
        "pre",
        null,
        createElement(
          "code",
          null,
          `import { JsonParser, ParseError } from "@asymmetric-effort/jsonlint";

const parser = new JsonParser();

parser.parseError = (message, hash) => {
  console.error(\`Line \${hash.line}: \${message}\`);
  throw new ParseError(message, hash);
};

try {
  parser.parse(input);
} catch (e) {
  // handle error
}`,
        ),
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "formatJson(input, indent?)"),
      createElement(
        "p",
        null,
        "Best-effort character-by-character JSON formatter. Works even on invalid JSON.",
      ),
      createElement(
        "pre",
        null,
        createElement(
          "code",
          null,
          `import { formatJson } from "@asymmetric-effort/jsonlint";

const pretty = formatJson('{"a":1,"b":2}', "  ");
// {
//   "a": 1,
//   "b": 2
// }`,
        ),
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "SchemaValidator"),
      createElement("p", null, "Validate parsed JSON against a JSON Schema (Draft-03)."),
      createElement(
        "pre",
        null,
        createElement(
          "code",
          null,
          `import { SchemaValidator } from "@asymmetric-effort/jsonlint";

const schema = {
  type: "object",
  properties: {
    name: { type: "string", required: true },
    age: { type: "integer", minimum: 0 },
  },
};

const validator = new SchemaValidator();
const errors = validator.validate({ name: "Alice", age: 30 }, schema);

if (errors.length > 0) {
  errors.forEach(e => console.error(\`\${e.property}: \${e.message}\`));
}`,
        ),
      ),
    ),
    createElement(
      "div",
      { className: "section" },
      createElement("h2", null, "Exports"),
      createElement(
        "table",
        null,
        createElement(
          "thead",
          null,
          createElement(
            "tr",
            null,
            createElement("th", null, "Export"),
            createElement("th", null, "Type"),
            createElement("th", null, "Description"),
          ),
        ),
        createElement(
          "tbody",
          null,
          ...[
            ["parse", "function", "Parse JSON string, return value or throw"],
            ["JsonParser", "class", "Reusable parser with custom error handler"],
            ["ParseError", "class", "Error thrown on parse failure"],
            ["LexerError", "class", "Error thrown on lexical failure"],
            ["TokenType", "enum", "Token type constants"],
            ["Lexer", "class", "JSON lexer / tokenizer"],
            ["formatJson", "function", "Best-effort JSON formatter"],
            ["SchemaValidator", "class", "JSON Schema Draft-03 validator"],
          ].map(([name, type, desc]) =>
            createElement(
              "tr",
              { key: name },
              createElement("td", null, createElement("code", null, name)),
              createElement("td", null, type),
              createElement("td", null, desc),
            ),
          ),
        ),
      ),
    ),
  );
}
