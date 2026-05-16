const SAMPLE_JSON = `{
  "name": "jsonlint",
  "version": "1.0.0",
  "keywords": ["json", "lint", "parser"]
}`;

export function ValidatorPage(): string {
  return `
    <div class="section">
      <h2>JSON Validator</h2>
      <p>Paste or type JSON below to validate, format, or sort keys.</p>
    </div>
    <div class="validator">
      <textarea id="json-input" placeholder="Paste JSON here..." spellcheck="false">${SAMPLE_JSON}</textarea>
      <div class="validator-actions">
        <button class="btn btn-primary" id="btn-validate">Validate</button>
        <button class="btn" id="btn-format">Format</button>
        <button class="btn" id="btn-sort">Sort Keys</button>
        <button class="btn" id="btn-clear">Clear</button>
      </div>
      <div id="result-container"></div>
    </div>`;
}
