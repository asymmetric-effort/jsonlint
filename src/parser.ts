import { Lexer, LexerError, TokenType } from "./lexer.js";
import type { Token, SourceLocation } from "./lexer.js";

export { LexerError };

export interface ParseErrorHash {
  text: string;
  token: string;
  line: number;
  loc: SourceLocation;
  expected: string[];
}

export class ParseError extends Error {
  hash: ParseErrorHash;

  constructor(message: string, hash: ParseErrorHash) {
    super(message);
    this.name = "ParseError";
    this.hash = hash;
  }
}

export class JsonParser {
  private lexer: Lexer;
  private currentToken!: Token;
  private previousToken: Token | null = null;
  private input: string = "";

  parseError:
    | ((str: string, hash: ParseErrorHash) => never)
    | null = null;

  constructor() {
    this.lexer = new Lexer();
  }

  parse(input: string): unknown {
    this.input = input;
    this.lexer.setInput(input);
    this.currentToken = this.lexer.nextToken();
    const result = this.parseValue();
    this.expect(TokenType.EOF);
    return result;
  }

  private advance(): Token {
    this.previousToken = this.currentToken;
    this.currentToken = this.lexer.nextToken();
    return this.previousToken;
  }

  private expect(type: TokenType): Token {
    if (this.currentToken.type !== type) {
      this.throwParseError(type);
    }
    return this.advance();
  }

  private throwParseError(...expected: TokenType[]): never {
    const token = this.currentToken;
    const hash: ParseErrorHash = {
      text: token.value,
      token: token.type,
      line: token.loc.first_line,
      loc: token.loc,
      expected: expected.map((t) => `'${t}'`),
    };

    if (this.parseError) {
      this.parseError(this.formatError(token, expected), hash);
    }

    const msg = this.formatError(token, expected);
    throw new ParseError(msg, hash);
  }

  private formatError(token: Token, expected: TokenType[]): string {
    const line = token.loc.first_line;
    const position = this.showPosition(token);
    const expectedStr = expected.map((t) => `'${t}'`).join(", ");
    const got =
      token.type === TokenType.EOF
        ? "'EOF'"
        : `'${token.value || token.type}'`;

    return `Parse error on line ${line}:\n${position}\nExpecting ${expectedStr}, got ${got}`;
  }

  private showPosition(token: Token): string {
    const lines = this.input.split("\n");
    const lineIdx = token.loc.first_line - 1;
    const errorLine = lines[lineIdx] || "";
    const col = token.loc.first_column;
    const before = errorLine.substring(Math.max(0, col - 20), col);
    const after = errorLine.substring(col, col + 20);
    const pad = new Array(before.length + 1).join("-");
    return before + after + "\n" + pad + "^";
  }

  private parseValue(): unknown {
    switch (this.currentToken.type) {
      case TokenType.STRING:
        return this.advance().value;
      case TokenType.NUMBER:
        return Number(this.advance().value);
      case TokenType.TRUE:
        this.advance();
        return true;
      case TokenType.FALSE:
        this.advance();
        return false;
      case TokenType.NULL:
        this.advance();
        return null;
      case TokenType.LBRACE:
        return this.parseObject();
      case TokenType.LBRACKET:
        return this.parseArray();
      default:
        this.throwParseError(
          TokenType.STRING,
          TokenType.NUMBER,
          TokenType.NULL,
          TokenType.TRUE,
          TokenType.FALSE,
          TokenType.LBRACE,
          TokenType.LBRACKET,
        );
    }
  }

  private parseObject(): Record<string, unknown> {
    this.expect(TokenType.LBRACE);
    const obj: Record<string, unknown> = {};

    if (this.currentToken.type === TokenType.RBRACE) {
      this.advance();
      return obj;
    }

    this.parseMember(obj);
    while (this.currentToken.type === TokenType.COMMA) {
      this.advance();
      this.parseMember(obj);
    }

    this.expect(TokenType.RBRACE);
    return obj;
  }

  private parseMember(obj: Record<string, unknown>): void {
    if (this.currentToken.type !== TokenType.STRING) {
      this.throwParseError(TokenType.STRING);
    }
    const key = this.advance().value;
    this.expect(TokenType.COLON);
    obj[key] = this.parseValue();
  }

  private parseArray(): unknown[] {
    this.expect(TokenType.LBRACKET);
    const arr: unknown[] = [];

    if (this.currentToken.type === TokenType.RBRACKET) {
      this.advance();
      return arr;
    }

    arr.push(this.parseValue());
    while (this.currentToken.type === TokenType.COMMA) {
      this.advance();
      arr.push(this.parseValue());
    }

    this.expect(TokenType.RBRACKET);
    return arr;
  }
}

const defaultParser = new JsonParser();

export function parse(input: string): unknown {
  return defaultParser.parse(input);
}
