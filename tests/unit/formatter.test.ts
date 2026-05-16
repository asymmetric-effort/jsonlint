import { describe, it, expect } from "bun:test";
import { formatJson } from "../../src/formatter.js";

describe("Formatter", () => {
  describe("basic formatting", () => {
    it("should format empty object", () => {
      expect(formatJson("{}")).toBe("{}");
    });

    it("should format empty array", () => {
      expect(formatJson("[]")).toBe("[]");
    });

    it("should format simple object", () => {
      const result = formatJson('{"a":1}');
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it("should format simple array", () => {
      const result = formatJson("[1,2,3]");
      expect(result).toBe("[\n  1,\n  2,\n  3\n]");
    });

    it("should format nested object", () => {
      const result = formatJson('{"a":{"b":1}}');
      expect(result).toContain("  ");
      expect(result).toContain('"a"');
      expect(result).toContain('"b"');
    });

    it("should format nested array", () => {
      const result = formatJson("[[1,2],[3,4]]");
      expect(result).toContain("[\n");
    });
  });

  describe("custom indent", () => {
    it("should use tab indent", () => {
      const result = formatJson('{"a":1}', "\t");
      expect(result).toBe('{\n\t"a": 1\n}');
    });

    it("should use 4-space indent", () => {
      const result = formatJson('{"a":1}', "    ");
      expect(result).toBe('{\n    "a": 1\n}');
    });
  });

  describe("strings", () => {
    it("should preserve string content", () => {
      const result = formatJson('{"key":"value with spaces"}');
      expect(result).toContain('"value with spaces"');
    });

    it("should preserve escape sequences in strings", () => {
      const result = formatJson('{"key":"line1\\nline2"}');
      expect(result).toContain("\\n");
    });

    it("should preserve colons in strings", () => {
      const result = formatJson('{"url":"http://example.com"}');
      expect(result).toContain('"http://example.com"');
    });

    it("should preserve braces in strings", () => {
      const result = formatJson('{"tpl":"{foo}"}');
      expect(result).toContain('"{foo}"');
    });

    it("should preserve brackets in strings", () => {
      const result = formatJson('{"arr":"[1,2]"}');
      expect(result).toContain('"[1,2]"');
    });

    it("should preserve commas in strings", () => {
      const result = formatJson('{"csv":"a,b,c"}');
      expect(result).toContain('"a,b,c"');
    });
  });

  describe("whitespace cleanup", () => {
    it("should remove extra spaces", () => {
      const result = formatJson('{  "a"  :  1  }');
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it("should remove extra newlines", () => {
      const result = formatJson('{\n\n\n"a":\n\n1\n\n}');
      expect(result).toBe('{\n  "a": 1\n}');
    });
  });

  describe("complex structures", () => {
    it("should format deeply nested structure", () => {
      const input = '{"a":{"b":{"c":[1,2,{"d":true}]}}}';
      const result = formatJson(input);
      expect(result).toContain('"a"');
      expect(result).toContain('"b"');
      expect(result).toContain('"c"');
      expect(result).toContain('"d"');
    });

    it("should handle mixed types", () => {
      const input = '[1,"two",true,null,{},[]]';
      const result = formatJson(input);
      expect(result).toContain("1");
      expect(result).toContain('"two"');
      expect(result).toContain("true");
      expect(result).toContain("null");
    });
  });

  describe("invalid JSON", () => {
    it("should still format invalid JSON best-effort", () => {
      const result = formatJson("{bad: value}");
      expect(result).toContain("{");
      expect(result).toContain("}");
    });

    it("should handle trailing commas", () => {
      const result = formatJson('{"a": 1,}');
      expect(result).toContain('"a"');
    });
  });

  describe("edge cases", () => {
    it("should handle unterminated bracket (isEmptyBracket fallthrough)", () => {
      // Input with [ but no closing ] — exercises the while-loop exhaustion path
      const result = formatJson("[");
      expect(result).toContain("[");
    });

    it("should handle closing bracket immediately after open (isPrecededByOpen true path)", () => {
      const result = formatJson("{ }");
      expect(result).toBe("{}");
    });

    it("should handle leading close bracket (isPrecededByOpen empty result fallthrough)", () => {
      // A } as first non-whitespace triggers isPrecededByOpen with empty result
      const result = formatJson("}");
      expect(result).toContain("}");
    });

    it("should handle empty input", () => {
      expect(formatJson("")).toBe("");
    });

    it("should handle single value", () => {
      expect(formatJson("42")).toBe("42");
    });

    it("should handle string value", () => {
      expect(formatJson('"hello"')).toBe('"hello"');
    });

    it("should handle boolean values", () => {
      expect(formatJson("true")).toBe("true");
      expect(formatJson("false")).toBe("false");
    });

    it("should handle null value", () => {
      expect(formatJson("null")).toBe("null");
    });
  });
});
