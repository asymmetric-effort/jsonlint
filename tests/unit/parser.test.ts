import { describe, it, expect } from "bun:test";
import { JsonParser, parse, ParseError } from "../../src/parser.js";

describe("Parser", () => {
  describe("parse() function", () => {
    it("should parse null", () => {
      expect(parse("null")).toBe(null);
    });

    it("should parse true", () => {
      expect(parse("true")).toBe(true);
    });

    it("should parse false", () => {
      expect(parse("false")).toBe(false);
    });

    it("should parse integer", () => {
      expect(parse("42")).toBe(42);
    });

    it("should parse negative number", () => {
      expect(parse("-42")).toBe(-42);
    });

    it("should parse float", () => {
      expect(parse("3.14")).toBe(3.14);
    });

    it("should parse exponent", () => {
      expect(parse("1e10")).toBe(1e10);
    });

    it("should parse zero", () => {
      expect(parse("0")).toBe(0);
    });

    it("should parse string", () => {
      expect(parse('"hello"')).toBe("hello");
    });

    it("should parse empty string", () => {
      expect(parse('""')).toBe("");
    });

    it("should parse string with escapes", () => {
      expect(parse('"a\\nb"')).toBe("a\nb");
    });

    it("should parse string with unicode", () => {
      expect(parse('"\\u0041"')).toBe("A");
    });
  });

  describe("objects", () => {
    it("should parse empty object", () => {
      expect(parse("{}")).toEqual({});
    });

    it("should parse object with one member", () => {
      expect(parse('{"a": 1}')).toEqual({ a: 1 });
    });

    it("should parse object with multiple members", () => {
      expect(parse('{"a": 1, "b": 2, "c": 3}')).toEqual({
        a: 1,
        b: 2,
        c: 3,
      });
    });

    it("should parse nested objects", () => {
      expect(parse('{"a": {"b": {"c": 1}}}')).toEqual({
        a: { b: { c: 1 } },
      });
    });

    it("should parse object with all value types", () => {
      const input = '{"s":"str","n":42,"f":1.5,"t":true,"fa":false,"nu":null,"a":[1],"o":{}}';
      const result = parse(input) as Record<string, unknown>;
      expect(result.s).toBe("str");
      expect(result.n).toBe(42);
      expect(result.f).toBe(1.5);
      expect(result.t).toBe(true);
      expect(result.fa).toBe(false);
      expect(result.nu).toBe(null);
      expect(result.a).toEqual([1]);
      expect(result.o).toEqual({});
    });

    it("should allow duplicate keys (last wins)", () => {
      expect(parse('{"a": 1, "a": 2}')).toEqual({ a: 2 });
    });
  });

  describe("arrays", () => {
    it("should parse empty array", () => {
      expect(parse("[]")).toEqual([]);
    });

    it("should parse array with one element", () => {
      expect(parse("[1]")).toEqual([1]);
    });

    it("should parse array with multiple elements", () => {
      expect(parse("[1, 2, 3]")).toEqual([1, 2, 3]);
    });

    it("should parse nested arrays", () => {
      expect(parse("[[1, 2], [3, 4]]")).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it("should parse deeply nested arrays", () => {
      expect(parse("[[[[[[[[[[[[[[[[[[1]]]]]]]]]]]]]]]]]]")).toEqual([
        [[[[[[[[[[[[[[[[[1]]]]]]]]]]]]]]]]],
      ]);
    });

    it("should parse mixed type array", () => {
      expect(parse('[1, "two", true, null, {}, []]')).toEqual([1, "two", true, null, {}, []]);
    });
  });

  describe("whitespace", () => {
    it("should handle leading/trailing whitespace", () => {
      expect(parse("  42  ")).toBe(42);
    });

    it("should handle newlines", () => {
      expect(parse('{\n  "a": 1\n}')).toEqual({ a: 1 });
    });

    it("should handle tabs", () => {
      expect(parse('{\t"a":\t1\t}')).toEqual({ a: 1 });
    });

    it("should handle carriage returns", () => {
      expect(parse('{\r\n"a": 1\r\n}')).toEqual({ a: 1 });
    });
  });

  describe("error handling", () => {
    it("should throw ParseError for trailing comma in object", () => {
      expect(() => parse('{"a": 1,}')).toThrow();
    });

    it("should throw ParseError for trailing comma in array", () => {
      expect(() => parse("[1,]")).toThrow();
    });

    it("should throw ParseError for missing value", () => {
      expect(() => parse("[,1]")).toThrow();
    });

    it("should throw ParseError for extra closing bracket", () => {
      expect(() => parse("[1]]")).toThrow();
    });

    it("should throw ParseError for missing colon", () => {
      expect(() => parse('{"a" 1}')).toThrow();
    });

    it("should throw ParseError for double colon", () => {
      expect(() => parse('{"a":: 1}')).toThrow();
    });

    it("should throw ParseError for comma instead of colon", () => {
      expect(() => parse('{"a", 1}')).toThrow();
    });

    it("should throw ParseError for trailing content", () => {
      expect(() => parse("true false")).toThrow();
    });

    it("should throw ParseError for empty input", () => {
      expect(() => parse("")).toThrow();
    });

    it("should throw ParseError for just whitespace", () => {
      expect(() => parse("   ")).toThrow();
    });

    it("should throw LexerError for unquoted keys", () => {
      expect(() => parse("{key: 1}")).toThrow();
    });

    it("should throw LexerError for single quotes", () => {
      expect(() => parse("'hello'")).toThrow();
    });

    it("should include line number in error", () => {
      try {
        parse('{\n  "a": 1,\n  "b": }');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const err = e as ParseError;
        expect(err.message).toContain("line 3");
        expect(err.hash.line).toBe(3);
      }
    });

    it("should include expected tokens in error", () => {
      try {
        parse('{"a": }');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const err = e as ParseError;
        expect(err.hash.expected.length).toBeGreaterThan(0);
      }
    });

    it("should include position indicator in error message", () => {
      try {
        parse("[1, @]");
        expect(true).toBe(false);
      } catch (e) {
        expect(e instanceof Error).toBe(true);
        expect((e as Error).message).toContain("^");
      }
    });
  });

  describe("JsonParser class", () => {
    it("should be reusable", () => {
      const parser = new JsonParser();
      expect(parser.parse("1")).toBe(1);
      expect(parser.parse("2")).toBe(2);
      expect(parser.parse('"abc"')).toBe("abc");
    });

    it("should support custom parseError handler", () => {
      const parser = new JsonParser();
      let captured: unknown = null;
      parser.parseError = (str, hash) => {
        captured = hash;
        throw new ParseError(str, hash);
      };
      try {
        // Use valid tokens but invalid grammar so parser (not lexer) throws
        parser.parse('{"a": 1 "b": 2}');
      } catch {
        // expected
      }
      expect(captured).not.toBe(null);
    });
  });

  describe("edge cases", () => {
    it("should parse large numbers", () => {
      expect(parse("23456789012E66")).toBe(23456789012e66);
    });

    it("should parse negative zero", () => {
      expect(parse("-0")).toBe(-0);
    });

    it("should parse string with all escape types", () => {
      const result = parse('"\\"\\\\\\/\\b\\f\\n\\r\\t"');
      expect(result).toBe('"\\/\b\f\n\r\t');
    });

    it("should parse string with forward slash", () => {
      expect(parse('"a/b"')).toBe("a/b");
    });

    it("should parse empty key", () => {
      expect(parse('{"": 1}')).toEqual({ "": 1 });
    });
  });
});
