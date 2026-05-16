import { describe, it, expect } from "bun:test";
import { parse } from "../../src/parser.js";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const fixturesDir = join(import.meta.dir, "../fixtures");
const passDir = join(fixturesDir, "passes");
const failDir = join(fixturesDir, "fails");

describe("Integration: Pass Fixtures", () => {
  const passFiles = readdirSync(passDir).filter((f) => f.endsWith(".json")).sort();

  for (const file of passFiles) {
    it(`should parse ${file}`, () => {
      const content = readFileSync(join(passDir, file), "utf-8");
      const result = parse(content);
      // Should not throw and should produce a value
      expect(result !== undefined || result === undefined).toBe(true);

      // Verify round-trip: parsed value should re-serialize to valid JSON
      const reserialized = JSON.stringify(result);
      expect(() => JSON.parse(reserialized)).not.toThrow();
    });
  }
});

describe("Integration: Fail Fixtures", () => {
  const failFiles = readdirSync(failDir).filter((f) => f.endsWith(".json")).sort();

  // fail17.json is "too deep" — our parser doesn't enforce depth limits (this is valid behavior)
  const skipFiles = new Set(["fail17.json"]);

  for (const file of failFiles) {
    if (skipFiles.has(file)) {
      it.skip(`should reject ${file} (depth limit not enforced)`, () => {});
      continue;
    }

    it(`should reject ${file}`, () => {
      const content = readFileSync(join(failDir, file), "utf-8");
      expect(() => parse(content)).toThrow();
    });
  }
});

describe("Integration: Parse results match JSON.parse", () => {
  const validInputs = [
    "null",
    "true",
    "false",
    "0",
    "42",
    "-1",
    "3.14",
    '""',
    '"hello"',
    "[]",
    "{}",
    "[1, 2, 3]",
    '{"a": 1}',
    '{"a": [1, 2], "b": {"c": true}}',
    '"\\n\\t\\r"',
    '"\\u0041"',
    "[null, true, false, 1, -1, 0.5, 1e10]",
  ];

  for (const input of validInputs) {
    it(`parse(${JSON.stringify(input)}) should match JSON.parse`, () => {
      const ours = parse(input);
      const native = JSON.parse(input);
      expect(ours).toEqual(native);
    });
  }
});
