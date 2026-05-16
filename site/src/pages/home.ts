export function HomePage(): string {
  const features = [
    ["Strict JSON Parsing", "ECMA-262 / RFC 7159 compliant recursive descent parser"],
    ["Detailed Errors", "Line/column tracking with visual position indicators"],
    ["JSON Schema", "Built-in Draft-03 schema validation"],
    ["Formatter", "Character-by-character formatter that works on invalid JSON"],
    ["CLI Tool", "Full-featured command-line interface with all standard flags"],
    ["Standalone Binary", "Compiled standalone executable via Bun"],
    ["Zero Dependencies", "No runtime dependencies \u2014 everything built from scratch"],
  ];

  const featureRows = features
    .map(([f, d]) => `<tr><td><strong>${f}</strong></td><td>${d}</td></tr>`)
    .join("");

  return `
    <div class="hero">
      <h1>@asymmetric-effort/jsonlint</h1>
      <p>A zero-dependency JSON parser, linter, and validator with detailed error reporting. Feature-compatible with zaach/jsonlint.</p>
      <div class="hero-badges">
        <span class="badge badge-primary">Zero Dependencies</span>
        <span class="badge">TypeScript</span>
        <span class="badge">MIT License</span>
        <span class="badge">100% Line Coverage</span>
      </div>
    </div>
    <div class="section">
      <h2>Installation</h2>
      <pre><code>npm install @asymmetric-effort/jsonlint</code></pre>
      <p>Or install globally for CLI usage:</p>
      <pre><code>npm install -g @asymmetric-effort/jsonlint</code></pre>
    </div>
    <div class="section">
      <h2>Quick Start</h2>
      <h3>Module API</h3>
      <pre><code>import { parse } from "@asymmetric-effort/jsonlint";

const result = parse('{"key": "value"}');
// Returns: { key: "value" }</code></pre>
      <h3>CLI</h3>
      <pre><code># Validate a file
jsonlint data.json

# Sort keys and format in place
jsonlint -s -i data.json

# Validate against a JSON Schema
jsonlint -V schema.json data.json</code></pre>
    </div>
    <div class="section">
      <h2>Features</h2>
      <table>
        <thead><tr><th>Feature</th><th>Description</th></tr></thead>
        <tbody>${featureRows}</tbody>
      </table>
    </div>`;
}
