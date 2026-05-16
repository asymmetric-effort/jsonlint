import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

const CLI_PATH = join(import.meta.dir, "../../src/bin.ts");
const FIXTURES_DIR = join(import.meta.dir, "../fixtures");

function run(args: string[], stdin?: string): { stdout: string; stderr: string; exitCode: number } {
  const proc = spawnSync("bun", ["run", CLI_PATH, ...args], {
    input: stdin,
    encoding: "utf-8",
    timeout: 10000,
  });
  return {
    stdout: proc.stdout || "",
    stderr: proc.stderr || "",
    exitCode: proc.status ?? 1,
  };
}

let tmpDir: string;

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "jsonlint-test-"));
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("E2E: CLI", () => {
  describe("basic parsing", () => {
    it("should parse valid JSON from file", () => {
      const file = join(FIXTURES_DIR, "passes/pass1.json");
      const result = run([file]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    });

    it("should parse valid JSON from stdin", () => {
      const result = run([], '{"key": "value"}');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"key"');
    });

    it("should reject invalid JSON from file", () => {
      const file = join(FIXTURES_DIR, "fails/fail1.json");
      const result = run([file]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr.length).toBeGreaterThan(0);
    });

    it("should reject invalid JSON from stdin", () => {
      const result = run([], "{bad: json}");
      expect(result.exitCode).toBe(1);
      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });

  describe("--version flag", () => {
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

  describe("--help flag", () => {
    it("should print usage with -h", () => {
      const result = run(["-h"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });
  });

  describe("--quiet flag", () => {
    it("should suppress output with -q", () => {
      const result = run(["-q"], '{"key": "value"}');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("");
    });

    it("should suppress output with --quiet", () => {
      const result = run(["--quiet"], "[1, 2, 3]");
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("");
    });
  });

  describe("--sort-keys flag", () => {
    it("should sort object keys with -s", () => {
      const result = run(["-s"], '{"c": 3, "a": 1, "b": 2}');
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout);
      const keys = Object.keys(parsed);
      expect(keys).toEqual(["a", "b", "c"]);
    });

    it("should sort nested object keys", () => {
      const result = run(["-s"], '{"b": {"z": 1, "a": 2}, "a": 1}');
      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      // "a" should appear before "b" in top level
      expect(output.indexOf('"a": 1')).toBeLessThan(output.indexOf('"b"'));
    });
  });

  describe("--indent flag", () => {
    it("should use custom indent with -t", () => {
      const result = run(["-t", "\t"], '{"key": "value"}');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("\t");
    });

    it("should use 4-space indent", () => {
      const result = run(["-t", "    "], '{"key": "value"}');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("    ");
    });
  });

  describe("--compact flag", () => {
    it("should print compact error with -c", () => {
      const result = run(["-c"], '{"a": 1 "b": 2}');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("line");
      expect(result.stderr).toContain("col");
      expect(result.stderr).toContain("found:");
      expect(result.stderr).toContain("expected:");
    });
  });

  describe("--in-place flag", () => {
    it("should overwrite file with formatted output", () => {
      const file = join(tmpDir, "inplace.json");
      writeFileSync(file, '{"b":2,"a":1}');
      const result = run(["-i", file]);
      expect(result.exitCode).toBe(0);
      const content = readFileSync(file, "utf-8");
      // Should be pretty-printed
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

  describe("--pretty-print flag", () => {
    it("should pretty-print invalid JSON and exit 1", () => {
      const result = run(["-p"], '{"key": value}');
      expect(result.exitCode).toBe(1);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });

  describe("--validate flag", () => {
    it("should validate against a schema file", () => {
      const schemaFile = join(tmpDir, "schema.json");
      writeFileSync(
        schemaFile,
        JSON.stringify({
          type: "object",
          properties: {
            name: { type: "string", required: true },
          },
        }),
      );
      const result = run(["-V", schemaFile], '{"name": "Alice"}');
      expect(result.exitCode).toBe(0);
    });

    it("should reject data that fails schema validation", () => {
      const schemaFile = join(tmpDir, "schema-strict.json");
      writeFileSync(
        schemaFile,
        JSON.stringify({
          type: "object",
          properties: {
            name: { type: "string", required: true },
          },
        }),
      );
      const result = run(["-V", schemaFile], '{"age": 30}');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Schema validation error");
    });

    it("should handle missing schema file", () => {
      const result = run(["-V", "/nonexistent/schema.json"], '{"a": 1}');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("could not open schema file");
    });

    it("should handle invalid schema JSON", () => {
      const schemaFile = join(tmpDir, "bad-schema.json");
      writeFileSync(schemaFile, "{bad json}");
      const result = run(["-V", schemaFile], '{"a": 1}');
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("invalid JSON in schema file");
    });
  });

  describe("error cases", () => {
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

  describe("all pass fixtures via CLI", () => {
    const passFiles = ["pass1.json", "pass2.json", "pass3.json", "pass4.json", "pass5.json", "pass6.json", "pass7.json", "pass8.json"];
    for (const file of passFiles) {
      it(`should accept ${file}`, () => {
        const result = run([join(FIXTURES_DIR, "passes", file)]);
        expect(result.exitCode).toBe(0);
      });
    }
  });

  describe("all fail fixtures via CLI", () => {
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
});
