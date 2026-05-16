# @asymmetric-effort/jsonlint

A pure TypeScript JSON parser, linter, and validator with detailed error reporting. Zero runtime dependencies.

Feature-compatible with [zaach/jsonlint](https://github.com/zaach/jsonlint).

## Installation

### NPM Package

```bash
npm install @asymmetric-effort/jsonlint
```

### Global CLI

```bash
npm install -g @asymmetric-effort/jsonlint
```

### Standalone Binary

Pre-compiled standalone binaries are produced via `make build`. The binary requires no runtime dependencies.

## CLI Usage

```bash
jsonlint myfile.json
```

Or pipe JSON via stdin:

```bash
echo '{"key": "value"}' | jsonlint
```

### Options

| Flag | Long Form | Description | Default |
|------|-----------|-------------|---------|
| `-v` | `--version` | Print version and exit | |
| `-s` | `--sort-keys` | Sort object keys in output | `false` |
| `-i` | `--in-place` | Overwrite the input file with formatted output | `false` |
| `-t CHAR` | `--indent CHAR` | Character(s) to use for indentation | `"  "` (2 spaces) |
| `-c` | `--compact` | Compact error display | `false` |
| `-V FILE` | `--validate FILE` | Validate against a JSON Schema (Draft-03) file | |
| `-e ENV` | `--environment ENV` | JSON Schema spec version | `json-schema-draft-03` |
| `-q` | `--quiet` | Do not print parsed JSON to stdout | `false` |
| `-p` | `--pretty-print` | Force pretty printing even if invalid | `false` |
| `-h` | `--help` | Show help message | |

### Examples

Validate and pretty-print:

```bash
jsonlint data.json
```

Sort keys:

```bash
jsonlint -s data.json
```

Format in place:

```bash
jsonlint -i data.json
```

Validate against a schema:

```bash
jsonlint -V schema.json data.json
```

Compact errors (useful for editor integrations):

```bash
jsonlint -c data.json
```

## Module API

```typescript
import { parse } from "@asymmetric-effort/jsonlint";

// Returns parsed value or throws ParseError
const result = parse('{"key": "value"}');
```

### Advanced Usage

```typescript
import { JsonParser, ParseError, LexerError } from "@asymmetric-effort/jsonlint";

const parser = new JsonParser();

// Custom error handler
parser.parseError = (message, hash) => {
  console.error(`Error at line ${hash.line}: ${message}`);
  throw new ParseError(message, hash);
};

try {
  parser.parse(input);
} catch (e) {
  if (e instanceof ParseError) {
    console.error("Parse error:", e.hash);
  } else if (e instanceof LexerError) {
    console.error("Lexer error:", e.message);
  }
}
```

### Formatter

```typescript
import { formatJson } from "@asymmetric-effort/jsonlint";

// Best-effort formatting (works even on invalid JSON)
const formatted = formatJson('{"a":1,"b":2}', "  ");
```

### Schema Validator

```typescript
import { SchemaValidator } from "@asymmetric-effort/jsonlint";
import type { JsonSchema } from "@asymmetric-effort/jsonlint";

const schema: JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", required: true },
    age: { type: "integer", minimum: 0 },
  },
};

const validator = new SchemaValidator();
const errors = validator.validate({ name: "Alice", age: 30 }, schema);

if (errors.length > 0) {
  errors.forEach((e) => console.error(`${e.property}: ${e.message}`));
}
```

## Building

```bash
make setup    # Install dependencies
make build    # Build library and standalone binary
make test     # Run all tests
make lint     # Run type checker
make help     # Show all targets
```

## License

MIT License. Copyright (c) 2026 Asymmetric Effort, LLC.
