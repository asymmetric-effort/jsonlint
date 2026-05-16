export function ApiPage(): string {
  const exports = [
    ["parse", "function", "Parse JSON string, return value or throw"],
    ["JsonParser", "class", "Reusable parser with custom error handler"],
    ["ParseError", "class", "Error thrown on parse failure"],
    ["LexerError", "class", "Error thrown on lexical failure"],
    ["TokenType", "enum", "Token type constants"],
    ["Lexer", "class", "JSON lexer / tokenizer"],
    ["formatJson", "function", "Best-effort JSON formatter"],
    ["SchemaValidator", "class", "JSON Schema Draft-03 validator"],
  ];

  const exportRows = exports
    .map(([name, type, desc]) => `<tr><td><code>${name}</code></td><td>${type}</td><td>${desc}</td></tr>`)
    .join("");

  return `
    <div class="section">
      <h2>Module API</h2>
      <p>Import from <code>@asymmetric-effort/jsonlint</code> to use the parser, formatter, and schema validator programmatically.</p>
    </div>
    <div class="section">
      <h2>parse(input)</h2>
      <p>Parse a JSON string. Returns the parsed value or throws a ParseError.</p>
      <pre><code>import { parse } from "@asymmetric-effort/jsonlint";

const result = parse('{"key": "value"}');
// { key: "value" }</code></pre>
    </div>
    <div class="section">
      <h2>JsonParser</h2>
      <p>For advanced usage, instantiate a parser with a custom error handler.</p>
      <pre><code>import { JsonParser, ParseError } from "@asymmetric-effort/jsonlint";

const parser = new JsonParser();

parser.parseError = (message, hash) => {
  console.error(\`Line \${hash.line}: \${message}\`);
  throw new ParseError(message, hash);
};

try {
  parser.parse(input);
} catch (e) {
  // handle error
}</code></pre>
    </div>
    <div class="section">
      <h2>formatJson(input, indent?)</h2>
      <p>Best-effort character-by-character JSON formatter. Works even on invalid JSON.</p>
      <pre><code>import { formatJson } from "@asymmetric-effort/jsonlint";

const pretty = formatJson('{"a":1,"b":2}', "  ");
// {
//   "a": 1,
//   "b": 2
// }</code></pre>
    </div>
    <div class="section">
      <h2>SchemaValidator</h2>
      <p>Validate parsed JSON against a JSON Schema (Draft-03).</p>
      <pre><code>import { SchemaValidator } from "@asymmetric-effort/jsonlint";

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
}</code></pre>
    </div>
    <div class="section">
      <h2>Exports</h2>
      <table>
        <thead><tr><th>Export</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>${exportRows}</tbody>
      </table>
    </div>`;
}
