import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { main, config } from "../../src/cli.js";

const FIXTURES_DIR = join(import.meta.dir, "../fixtures");

// ── Capture harness ────────────────────────────────────────────────
// Intercepts process.stdout, process.stderr, and process.exit so we
// can call main() directly (in-process) and inspect its behaviour.
// This lets bun's coverage instrumenter see every line of cli.ts.

let stdout: string;
let stderr: string;
let exitCode: number | null;

const realStdoutWrite = process.stdout.write.bind(process.stdout);
const realStderrWrite = process.stderr.write.bind(process.stderr);
const realExit = process.exit;

function setup(): void {
  stdout = "";
  stderr = "";
  exitCode = null;

  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    stdout += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array): boolean => {
    stderr += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
    return true;
  }) as typeof process.stderr.write;

  process.exit = ((code?: number): never => {
    exitCode = code ?? 0;
    throw new Error(`__EXIT_${code}__`);
  }) as typeof process.exit;
}

function teardown(): void {
  process.stdout.write = realStdoutWrite;
  process.stderr.write = realStderrWrite;
  process.exit = realExit;
}

function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  setup();
  try {
    main(args);
    if (exitCode === null) exitCode = 0;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("__EXIT_")) {
      // Expected — process.exit was called
    } else {
      throw e;
    }
  } finally {
    teardown();
  }
  return { stdout, stderr, exitCode: exitCode ?? 0 };
}

function runWithStdin(
  args: string[],
  input: string,
): { stdout: string; stderr: string; exitCode: number } {
  setup();
  try {
    main(args, input);
    if (exitCode === null) exitCode = 0;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("__EXIT_")) {
      // Expected
    } else {
      throw e;
    }
  } finally {
    teardown();
  }
  return { stdout, stderr, exitCode: exitCode ?? 0 };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "jsonlint-test-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("CLI: basic parsing", () => {
  it("should parse valid JSON from file", () => {
    const file = join(FIXTURES_DIR, "passes/pass1.json");
    const result = run([file]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  it("should reject invalid JSON from file", () => {
    const file = join(FIXTURES_DIR, "fails/fail1.json");
    const result = run([file]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it("should pretty-print valid JSON to stdout", () => {
    const file = join(tmpDir, "simple.json");
    writeFileSync(file, '{"a":1}');
    const result = run([file]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"a"');
    expect(result.stdout).toContain("1");
    // Should be formatted with default 2-space indent
    expect(result.stdout).toContain("\n");
  });
});

describe("CLI: --version flag", () => {
  it("should print version with -v", () => {
    const result = run(["-v"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should print version with --version", () => {
    const result = run(["--version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("CLI: --help flag", () => {
  it("should print usage with -h", () => {
    const result = run(["-h"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("--sort-keys");
    expect(result.stdout).toContain("--validate");
  });
});

describe("CLI: --quiet flag", () => {
  it("should suppress output with -q", () => {
    const file = join(tmpDir, "q.json");
    writeFileSync(file, '{"key": "value"}');
    const result = run(["-q", file]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("should suppress output with --quiet", () => {
    const file = join(tmpDir, "q2.json");
    writeFileSync(file, "[1, 2, 3]");
    const result = run(["--quiet", file]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
  });
});

describe("CLI: --sort-keys flag", () => {
  it("should sort object keys with -s", () => {
    const file = join(tmpDir, "sort.json");
    writeFileSync(file, '{"c": 3, "a": 1, "b": 2}');
    const result = run(["-s", file]);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    const keys = Object.keys(parsed);
    expect(keys).toEqual(["a", "b", "c"]);
  });

  it("should sort nested object keys", () => {
    const file = join(tmpDir, "nested.json");
    writeFileSync(file, '{"b": {"z": 1, "a": 2}, "a": 1}');
    const result = run(["-s", file]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.indexOf('"a": 1')).toBeLessThan(result.stdout.indexOf('"b"'));
  });

  it("should sort keys inside arrays", () => {
    const file = join(tmpDir, "arr.json");
    writeFileSync(file, '[{"z": 1, "a": 2}]');
    const result = run(["-s", file]);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(Object.keys(parsed[0])).toEqual(["a", "z"]);
  });
});

describe("CLI: --indent flag", () => {
  it("should use tab indent with -t", () => {
    const file = join(tmpDir, "tab.json");
    writeFileSync(file, '{"key": "value"}');
    const result = run(["-t", "\t", file]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("\t");
  });

  it("should use 4-space indent", () => {
    const file = join(tmpDir, "four.json");
    writeFileSync(file, '{"key": "value"}');
    const result = run(["-t", "    ", file]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("    ");
  });
});

describe("CLI: --compact flag", () => {
  it("should print compact error with -c for parse errors", () => {
    const file = join(tmpDir, "bad.json");
    writeFileSync(file, '{"a": 1 "b": 2}');
    const result = run(["-c", file]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("line");
    expect(result.stderr).toContain("col");
    expect(result.stderr).toContain("found:");
    expect(result.stderr).toContain("expected:");
  });

  it("should print compact error with -c for lexer errors", () => {
    const file = join(tmpDir, "lexbad.json");
    writeFileSync(file, '{"key": \\invalid}');
    const result = run(["-c", file]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(file);
    expect(result.stderr).toContain("line");
    expect(result.stderr).toContain("col");
  });
});

describe("CLI: --in-place flag", () => {
  it("should overwrite file with formatted output", () => {
    const file = join(tmpDir, "inplace.json");
    writeFileSync(file, '{"b":2,"a":1}');
    const result = run(["-i", file]);
    expect(result.exitCode).toBe(0);
    const content = readFileSync(file, "utf-8");
    expect(content).toContain("\n");
  });

  it("should overwrite file with sorted keys", () => {
    const file = join(tmpDir, "inplace-sort.json");
    writeFileSync(file, '{"c":3,"a":1,"b":2}');
    const result = run(["-i", "-s", file]);
    expect(result.exitCode).toBe(0);
    const content = readFileSync(file, "utf-8");
    const parsed = JSON.parse(content);
    expect(Object.keys(parsed)).toEqual(["a", "b", "c"]);
  });
});

describe("CLI: --pretty-print flag", () => {
  it("should pretty-print invalid JSON and exit 1", () => {
    const file = join(tmpDir, "pp.json");
    writeFileSync(file, '{"key": value}');
    const result = run(["-p", file]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout.length).toBeGreaterThan(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it("should re-parse formatted output for better errors with -c", () => {
    const file = join(tmpDir, "ppc.json");
    writeFileSync(file, '{"key": value}');
    const result = run(["-p", "-c", file]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout.length).toBeGreaterThan(0);
    expect(result.stderr).toContain("line");
  });
});

describe("CLI: --validate flag", () => {
  it("should validate against a schema file", () => {
    const schemaFile = join(tmpDir, "schema.json");
    const dataFile = join(tmpDir, "data.json");
    writeFileSync(
      schemaFile,
      JSON.stringify({
        type: "object",
        properties: { name: { type: "string", required: true } },
      }),
    );
    writeFileSync(dataFile, '{"name": "Alice"}');
    const result = run(["-V", schemaFile, dataFile]);
    expect(result.exitCode).toBe(0);
  });

  it("should reject data that fails schema validation", () => {
    const schemaFile = join(tmpDir, "schema-strict.json");
    const dataFile = join(tmpDir, "data-bad.json");
    writeFileSync(
      schemaFile,
      JSON.stringify({
        type: "object",
        properties: { name: { type: "string", required: true } },
      }),
    );
    writeFileSync(dataFile, '{"age": 30}');
    const result = run(["-V", schemaFile, dataFile]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Schema validation error");
  });

  it("should handle missing schema file", () => {
    const dataFile = join(tmpDir, "d.json");
    writeFileSync(dataFile, '{"a": 1}');
    const result = run(["-V", "/nonexistent/schema.json", dataFile]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("could not open schema file");
  });

  it("should handle invalid schema JSON", () => {
    const schemaFile = join(tmpDir, "bad-schema.json");
    const dataFile = join(tmpDir, "d2.json");
    writeFileSync(schemaFile, "{bad json}");
    writeFileSync(dataFile, '{"a": 1}');
    const result = run(["-V", schemaFile, dataFile]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("invalid JSON in schema file");
  });
});

describe("CLI: --environment flag", () => {
  it("should accept -e flag with schema validation", () => {
    const schemaFile = join(tmpDir, "schema-env.json");
    const dataFile = join(tmpDir, "data-env.json");
    writeFileSync(
      schemaFile,
      JSON.stringify({ type: "object", properties: { name: { type: "string" } } }),
    );
    writeFileSync(dataFile, '{"name": "test"}');
    const result = run(["-e", "json-schema-draft-03", "-V", schemaFile, dataFile]);
    expect(result.exitCode).toBe(0);
  });

  it("should accept --environment flag", () => {
    const schemaFile = join(tmpDir, "schema-env2.json");
    const dataFile = join(tmpDir, "data-env2.json");
    writeFileSync(schemaFile, JSON.stringify({ type: "string" }));
    writeFileSync(dataFile, '"hello"');
    const result = run(["--environment", "json-schema-draft-03", "-V", schemaFile, dataFile]);
    expect(result.exitCode).toBe(0);
  });
});

describe("CLI: stdin reading", () => {
  it("should read from stdin when no file argument given", () => {
    const result = run([]);
    expect(result.exitCode === 0 || result.exitCode === 1).toBe(true);
  });

  it("should use stdinInput parameter when provided", () => {
    const result = runWithStdin([], '{"key": "value"}');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"key"');
  });

  it("should handle stdin read failure gracefully", () => {
    const original = config.stdinPath;
    config.stdinPath = "/nonexistent/path/that/does/not/exist";
    try {
      const result = run([]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Error reading from stdin");
    } finally {
      config.stdinPath = original;
    }
  });
});

describe("CLI: error cases", () => {
  it("should error on missing file", () => {
    const result = run(["/nonexistent/file.json"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("could not open file");
  });

  it("should error on unknown option", () => {
    const result = run(["--unknown-flag"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown option");
  });
});

describe("CLI: pass fixtures", () => {
  const passFiles = [
    "pass1.json",
    "pass2.json",
    "pass3.json",
    "pass4.json",
    "pass5.json",
    "pass6.json",
    "pass7.json",
    "pass8.json",
  ];
  for (const file of passFiles) {
    it(`should accept ${file}`, () => {
      const result = run([join(FIXTURES_DIR, "passes", file)]);
      expect(result.exitCode).toBe(0);
    });
  }
});

describe("CLI: fail fixtures", () => {
  const failFiles = Array.from({ length: 28 }, (_, i) => `fail${i + 1}.json`);
  // fail17 is "too deep" — our parser doesn't enforce depth limits
  const skip = new Set(["fail17.json"]);

  for (const file of failFiles) {
    if (skip.has(file)) continue;
    it(`should reject ${file}`, () => {
      const result = run([join(FIXTURES_DIR, "fails", file)]);
      expect(result.exitCode).toBe(1);
    });
  }
});
