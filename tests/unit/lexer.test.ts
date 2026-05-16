import { describe, it, expect } from "bun:test";
import { Lexer, LexerError, TokenType } from "../../src/lexer.js";

function tokenize(input: string) {
  const lexer = new Lexer();
  lexer.setInput(input);
  const tokens = [];
  let token;
  do {
    token = lexer.nextToken();
    tokens.push(token);
  } while (token.type !== TokenType.EOF);
  return tokens;
}

function firstToken(input: string) {
  const lexer = new Lexer();
  lexer.setInput(input);
  return lexer.nextToken();
}

describe("Lexer", () => {
  describe("structural tokens", () => {
    it("should tokenize {", () => {
      const t = firstToken("{");
      expect(t.type).toBe(TokenType.LBRACE);
      expect(t.value).toBe("{");
    });

    it("should tokenize }", () => {
      const t = firstToken("}");
      expect(t.type).toBe(TokenType.RBRACE);
    });

    it("should tokenize [", () => {
      const t = firstToken("[");
      expect(t.type).toBe(TokenType.LBRACKET);
    });

    it("should tokenize ]", () => {
      const t = firstToken("]");
      expect(t.type).toBe(TokenType.RBRACKET);
    });

    it("should tokenize ,", () => {
      const t = firstToken(",");
      expect(t.type).toBe(TokenType.COMMA);
    });

    it("should tokenize :", () => {
      const t = firstToken(":");
      expect(t.type).toBe(TokenType.COLON);
    });
  });

  describe("keywords", () => {
    it("should tokenize true", () => {
      const t = firstToken("true");
      expect(t.type).toBe(TokenType.TRUE);
      expect(t.value).toBe("true");
    });

    it("should tokenize false", () => {
      const t = firstToken("false");
      expect(t.type).toBe(TokenType.FALSE);
      expect(t.value).toBe("false");
    });

    it("should tokenize null", () => {
      const t = firstToken("null");
      expect(t.type).toBe(TokenType.NULL);
      expect(t.value).toBe("null");
    });

    it("should reject partial keywords", () => {
      expect(() => firstToken("tru")).toThrow(LexerError);
      expect(() => firstToken("fals")).toThrow(LexerError);
      expect(() => firstToken("nul")).toThrow(LexerError);
    });
  });

  describe("strings", () => {
    it("should tokenize empty string", () => {
      const t = firstToken('""');
      expect(t.type).toBe(TokenType.STRING);
      expect(t.value).toBe("");
    });

    it("should tokenize simple string", () => {
      const t = firstToken('"hello"');
      expect(t.type).toBe(TokenType.STRING);
      expect(t.value).toBe("hello");
    });

    it("should tokenize string with escape sequences", () => {
      const t = firstToken('"a\\"b\\\\c\\/d"');
      expect(t.value).toBe('a"b\\c/d');
    });

    it("should decode \\n \\r \\t \\b \\f", () => {
      const t = firstToken('"\\n\\r\\t\\b\\f"');
      expect(t.value).toBe("\n\r\t\b\f");
    });

    it("should decode unicode escapes", () => {
      const t = firstToken('"\\u0041"');
      expect(t.value).toBe("A");
    });

    it("should decode mixed unicode escapes", () => {
      const t = firstToken('"\\u0048\\u0065\\u006C\\u006C\\u006F"');
      expect(t.value).toBe("Hello");
    });

    it("should reject unterminated string", () => {
      expect(() => firstToken('"hello')).toThrow(LexerError);
    });

    it("should reject string with newline", () => {
      expect(() => firstToken('"hello\nworld"')).toThrow(LexerError);
    });

    it("should reject string with tab control character", () => {
      expect(() => firstToken('"hello\tworld"')).toThrow(LexerError);
    });

    it("should reject invalid escape", () => {
      expect(() => firstToken('"\\x41"')).toThrow(LexerError);
    });

    it("should reject \\0 escape", () => {
      expect(() => firstToken('"\\0"')).toThrow(LexerError);
    });

    it("should reject bad unicode escape", () => {
      expect(() => firstToken('"\\u00zz"')).toThrow(LexerError);
    });

    it("should reject unterminated escape", () => {
      expect(() => firstToken('"\\')).toThrow(LexerError);
    });

    it("should reject control characters in string", () => {
      expect(() => firstToken('"\x01"')).toThrow(LexerError);
    });
  });

  describe("numbers", () => {
    it("should tokenize zero", () => {
      const t = firstToken("0");
      expect(t.type).toBe(TokenType.NUMBER);
      expect(t.value).toBe("0");
    });

    it("should tokenize integer", () => {
      const t = firstToken("42");
      expect(t.type).toBe(TokenType.NUMBER);
      expect(t.value).toBe("42");
    });

    it("should tokenize negative integer", () => {
      const t = firstToken("-42");
      expect(t.type).toBe(TokenType.NUMBER);
      expect(t.value).toBe("-42");
    });

    it("should tokenize decimal", () => {
      const t = firstToken("3.14");
      expect(t.type).toBe(TokenType.NUMBER);
      expect(t.value).toBe("3.14");
    });

    it("should tokenize negative decimal", () => {
      const t = firstToken("-0.5");
      expect(t.value).toBe("-0.5");
    });

    it("should tokenize exponent", () => {
      const t = firstToken("1e10");
      expect(t.value).toBe("1e10");
    });

    it("should tokenize upper-case exponent", () => {
      const t = firstToken("1E10");
      expect(t.value).toBe("1E10");
    });

    it("should tokenize positive exponent", () => {
      const t = firstToken("1e+10");
      expect(t.value).toBe("1e+10");
    });

    it("should tokenize negative exponent", () => {
      const t = firstToken("1e-10");
      expect(t.value).toBe("1e-10");
    });

    it("should tokenize decimal with exponent", () => {
      const t = firstToken("3.14e2");
      expect(t.value).toBe("3.14e2");
    });

    it("should tokenize large number", () => {
      const t = firstToken("1234567890");
      expect(t.value).toBe("1234567890");
    });

    it("should reject leading zeros", () => {
      expect(() => firstToken("013")).toThrow(LexerError);
    });

    it("should reject incomplete exponent", () => {
      expect(() => firstToken("1e")).toThrow(LexerError);
    });

    it("should reject decimal without digits after dot", () => {
      expect(() => firstToken("1.")).toThrow(LexerError);
    });

    it("should reject minus without digits", () => {
      expect(() => firstToken("-")).toThrow(LexerError);
    });

    it("should reject exponent with sign but no digits", () => {
      expect(() => firstToken("1e+")).toThrow(LexerError);
    });
  });

  describe("whitespace handling", () => {
    it("should skip spaces", () => {
      const tokens = tokenize("  true  ");
      expect(tokens[0].type).toBe(TokenType.TRUE);
    });

    it("should skip tabs", () => {
      const tokens = tokenize("\ttrue\t");
      expect(tokens[0].type).toBe(TokenType.TRUE);
    });

    it("should skip newlines", () => {
      const tokens = tokenize("\ntrue\n");
      expect(tokens[0].type).toBe(TokenType.TRUE);
    });

    it("should skip carriage returns", () => {
      const tokens = tokenize("\r\ntrue\r\n");
      expect(tokens[0].type).toBe(TokenType.TRUE);
    });
  });

  describe("location tracking", () => {
    it("should track line and column for first token", () => {
      const t = firstToken("true");
      expect(t.loc.first_line).toBe(1);
      expect(t.loc.first_column).toBe(0);
    });

    it("should track location after whitespace", () => {
      const t = firstToken("   true");
      expect(t.loc.first_line).toBe(1);
      expect(t.loc.first_column).toBe(3);
    });

    it("should track location on second line", () => {
      const tokens = tokenize("true\nfalse");
      expect(tokens[1].loc.first_line).toBe(2);
      expect(tokens[1].loc.first_column).toBe(0);
    });

    it("should track location correctly for multi-token input", () => {
      const tokens = tokenize('{"key": "value"}');
      // { at col 0
      expect(tokens[0].loc.first_column).toBe(0);
      // "key" at col 1
      expect(tokens[1].loc.first_column).toBe(1);
      // : at col 6
      expect(tokens[2].loc.first_column).toBe(6);
    });
  });

  describe("EOF", () => {
    it("should return EOF for empty input", () => {
      const t = firstToken("");
      expect(t.type).toBe(TokenType.EOF);
    });

    it("should return EOF for whitespace-only input", () => {
      const t = firstToken("   ");
      expect(t.type).toBe(TokenType.EOF);
    });
  });

  describe("invalid input", () => {
    it("should throw on unrecognized characters", () => {
      expect(() => firstToken("@")).toThrow(LexerError);
    });

    it("should throw on bare identifier", () => {
      expect(() => firstToken("undefined")).toThrow(LexerError);
    });
  });

  describe("LexerError", () => {
    it("should include line and column", () => {
      try {
        firstToken("@");
        expect(true).toBe(false); // should not reach
      } catch (e) {
        expect(e).toBeInstanceOf(LexerError);
        const err = e as LexerError;
        expect(err.line).toBe(1);
        expect(err.column).toBe(0);
      }
    });

    it("showPosition should produce visual indicator", () => {
      try {
        const lexer = new Lexer();
        lexer.setInput('{"key": @}');
        lexer.nextToken(); // {
        lexer.nextToken(); // "key"
        lexer.nextToken(); // :
        lexer.nextToken(); // @ should throw
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(LexerError);
        const err = e as LexerError;
        expect(err.showPosition()).toContain("^");
      }
    });
  });

  describe("complete tokenization", () => {
    it("should tokenize a complete JSON object", () => {
      const tokens = tokenize('{"a": 1, "b": true}');
      const types = tokens.map((t) => t.type);
      expect(types).toEqual([
        TokenType.LBRACE,
        TokenType.STRING,
        TokenType.COLON,
        TokenType.NUMBER,
        TokenType.COMMA,
        TokenType.STRING,
        TokenType.COLON,
        TokenType.TRUE,
        TokenType.RBRACE,
        TokenType.EOF,
      ]);
    });

    it("should tokenize a complete JSON array", () => {
      const tokens = tokenize('[1, "two", null]');
      const types = tokens.map((t) => t.type);
      expect(types).toEqual([
        TokenType.LBRACKET,
        TokenType.NUMBER,
        TokenType.COMMA,
        TokenType.STRING,
        TokenType.COMMA,
        TokenType.NULL,
        TokenType.RBRACKET,
        TokenType.EOF,
      ]);
    });
  });
});
