import { describe, it, expect } from "bun:test";
import {
  parse,
  parser,
  JsonParser,
  ParseError,
  Lexer,
  LexerError,
  TokenType,
  formatJson,
  formatter,
  SchemaValidator,
} from "../../src/index.js";

describe("Package exports", () => {
  it("should export parse function", () => {
    expect(typeof parse).toBe("function");
    expect(parse("42")).toBe(42);
  });

  it("should export parser singleton with parse method", () => {
    expect(parser).toBeInstanceOf(JsonParser);
    expect(typeof parser.parse).toBe("function");
    expect(parser.parse('"hello"')).toBe("hello");
  });

  it("should expose parser.lexer", () => {
    expect(parser.lexer).toBeInstanceOf(Lexer);
  });

  it("should expose parser.yy", () => {
    expect(typeof parser.yy).toBe("object");
  });

  it("should expose parser.parseError as overridable", () => {
    const p = new JsonParser();
    expect(p.parseError).toBe(null);
    let called = false;
    p.parseError = (str, hash) => {
      called = true;
      throw new ParseError(str, hash);
    };
    try {
      p.parse('{"a": }');
    } catch {
      // expected
    }
    expect(called).toBe(true);
  });

  it("should export JsonParser class", () => {
    expect(typeof JsonParser).toBe("function");
  });

  it("should export ParseError class", () => {
    expect(typeof ParseError).toBe("function");
  });

  it("should export LexerError class", () => {
    expect(typeof LexerError).toBe("function");
  });

  it("should export Lexer class", () => {
    expect(typeof Lexer).toBe("function");
  });

  it("should export TokenType enum", () => {
    expect(TokenType.STRING).toBe("STRING");
    expect(TokenType.EOF).toBe("EOF");
  });

  it("should export formatJson function", () => {
    expect(typeof formatJson).toBe("function");
    expect(formatJson('{"a":1}')).toContain('"a"');
  });

  it("should export formatter namespace with formatJson", () => {
    expect(typeof formatter).toBe("object");
    expect(typeof formatter.formatJson).toBe("function");
    expect(formatter.formatJson('{"a":1}')).toContain('"a"');
  });

  it("should export SchemaValidator class", () => {
    expect(typeof SchemaValidator).toBe("function");
  });
});
