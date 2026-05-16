import { readFileSync, writeFileSync } from "fs";
import { JsonParser, ParseError } from "./parser.js";
import { LexerError } from "./lexer.js";
import { formatJson } from "./formatter.js";
import { SchemaValidator } from "./schema.js";
import { VERSION } from "./version.js";
import type { JsonSchema } from "./schema.js";
import type { ParseErrorHash } from "./parser.js";

interface CliOptions {
  file: string | null;
  sortKeys: boolean;
  inPlace: boolean;
  indent: string;
  compact: boolean;
  validate: string | null;
  environment: string;
  quiet: boolean;
  prettyPrint: boolean;
  version: boolean;
}

function printVersion(): void {
  process.stdout.write(`${VERSION}\n`);
}

function printUsage(): void {
  process.stdout.write(`Usage: jsonlint [OPTIONS] [FILE]

Options:
  -v, --version            Print version and exit
  -s, --sort-keys          Sort object keys in output
  -i, --in-place           Overwrite the input file with formatted output
  -t, --indent CHAR        Character(s) to use for indentation (default: "  ")
  -c, --compact            Compact error display
  -V, --validate FILE      Validate against a JSON Schema file
  -e, --environment ENV    JSON Schema spec version (default: json-schema-draft-03)
  -q, --quiet              Do not print parsed JSON to stdout
  -p, --pretty-print       Force pretty printing (even if invalid)
  -h, --help               Show this help message

If FILE is omitted, reads from stdin.
`);
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    file: null,
    sortKeys: false,
    inPlace: false,
    indent: "  ",
    compact: false,
    validate: null,
    environment: "json-schema-draft-03",
    quiet: false,
    prettyPrint: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    switch (arg) {
      case "-v":
      case "--version":
        opts.version = true;
        break;
      case "-s":
      case "--sort-keys":
        opts.sortKeys = true;
        break;
      case "-i":
      case "--in-place":
        opts.inPlace = true;
        break;
      case "-t":
      case "--indent":
        i++;
        opts.indent = args[i] ?? "  ";
        break;
      case "-c":
      case "--compact":
        opts.compact = true;
        break;
      case "-V":
      case "--validate":
        i++;
        opts.validate = args[i] ?? null;
        break;
      case "-e":
      case "--environment":
        i++;
        opts.environment = args[i] ?? "json-schema-draft-03";
        break;
      case "-q":
      case "--quiet":
        opts.quiet = true;
        break;
      case "-p":
      case "--pretty-print":
        opts.prettyPrint = true;
        break;
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("-")) {
          process.stderr.write(`Unknown option: ${arg}\n`);
          process.exit(1);
        }
        opts.file = arg;
        break;
    }
    i++;
  }

  return opts;
}

function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

function readStdin(): string {
  try {
    return readFileSync("/dev/stdin", "utf-8");
  } catch {
    process.stderr.write("Error reading from stdin\n");
    process.exit(1);
  }
}

export function main(args?: string[]): void {
  const cliArgs = args ?? process.argv.slice(2);
  const opts = parseArgs(cliArgs);

  if (opts.version) {
    printVersion();
    return;
  }

  let input: string;
  let filename: string;

  if (opts.file) {
    try {
      input = readFileSync(opts.file, "utf-8");
    } catch {
      process.stderr.write(`Error: could not open file '${opts.file}'\n`);
      process.exit(1);
      return;
    }
    filename = opts.file;
  } else {
    input = readStdin();
    filename = "<stdin>";
  }

  const parser = new JsonParser();

  // Compact error mode
  if (opts.compact) {
    parser.parseError = (str: string, hash: ParseErrorHash): never => {
      const line = hash.line;
      const col = hash.loc.last_column;
      const found = hash.token === "EOF" ? "EOF" : hash.text || hash.token;
      const expected = hash.expected.join(", ");
      const msg = `${filename}: line ${line}, col ${col}, found: '${found}' - expected: ${expected}.`;
      throw new ParseError(msg, hash);
    };
  }

  function formatCompactError(e: unknown): string {
    if (opts.compact && e instanceof LexerError) {
      return `${filename}: line ${e.line}, col ${e.column}, ${e.message.split("\n")[0]}`;
    }
    return e instanceof Error ? e.message : String(e);
  }

  let parsed: unknown;

  try {
    parsed = parser.parse(input);
  } catch (e: unknown) {
    if (opts.prettyPrint) {
      // Try to format anyway
      const formatted = formatJson(input, opts.indent);
      process.stdout.write(formatted + "\n");

      // Re-parse to get better error location
      try {
        const reformatParser = new JsonParser();
        if (opts.compact) {
          reformatParser.parseError = parser.parseError;
        }
        reformatParser.parse(formatted);
      } catch (e2: unknown) {
        process.stderr.write(formatCompactError(e2) + "\n");
      }
      process.exit(1);
      return;
    }

    process.stderr.write(formatCompactError(e) + "\n");
    process.exit(1);
    return;
  }

  // Schema validation
  if (opts.validate) {
    let schemaInput: string;
    try {
      schemaInput = readFileSync(opts.validate, "utf-8");
    } catch {
      process.stderr.write(`Error: could not open schema file '${opts.validate}'\n`);
      process.exit(1);
      return;
    }

    let schema: JsonSchema;
    try {
      schema = JSON.parse(schemaInput) as JsonSchema;
    } catch {
      process.stderr.write(`Error: invalid JSON in schema file '${opts.validate}'\n`);
      process.exit(1);
      return;
    }

    const validator = new SchemaValidator();
    const errors = validator.validate(parsed, schema);
    if (errors.length > 0) {
      for (const err of errors) {
        process.stderr.write(
          `Schema validation error: property '${err.property}': ${err.message}\n`,
        );
      }
      process.exit(1);
      return;
    }
  }

  // Output
  if (opts.sortKeys) {
    parsed = sortObject(parsed);
  }

  const output = JSON.stringify(parsed, null, opts.indent);

  if (opts.inPlace && opts.file) {
    writeFileSync(opts.file, output + "\n", "utf-8");
  } else if (!opts.quiet) {
    process.stdout.write(output + "\n");
  }
}
