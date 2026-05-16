export function CliPage(): string {
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

  const optionRows = options
    .map(
      ([flag, long, desc]) =>
        `<tr><td><code>${flag}</code></td><td><code>${long}</code></td><td>${desc}</td></tr>`,
    )
    .join("");

  return `
    <div class="section">
      <h2>CLI Reference</h2>
      <p>The jsonlint command-line tool validates, formats, and optionally transforms JSON files.</p>
      <pre><code>jsonlint [OPTIONS] [FILE]</code></pre>
      <p>If FILE is omitted, reads from stdin.</p>
    </div>
    <div class="section">
      <h2>Options</h2>
      <table>
        <thead><tr><th>Flag</th><th>Long Form</th><th>Description</th></tr></thead>
        <tbody>${optionRows}</tbody>
      </table>
    </div>
    <div class="section">
      <h2>Examples</h2>
      <h3>Validate and pretty-print</h3>
      <pre><code>jsonlint data.json</code></pre>
      <h3>Sort keys</h3>
      <pre><code>jsonlint -s data.json</code></pre>
      <h3>Format in place</h3>
      <pre><code>jsonlint -i data.json</code></pre>
      <h3>Validate against a schema</h3>
      <pre><code>jsonlint -V schema.json data.json</code></pre>
      <h3>Compact errors (for editor integration)</h3>
      <pre><code>$ jsonlint -c bad.json
bad.json: line 2, col 5, found: '}' - expected: 'STRING'.</code></pre>
      <h3>Read from stdin</h3>
      <pre><code>echo '{"key": "value"}' | jsonlint -q</code></pre>
    </div>`;
}
