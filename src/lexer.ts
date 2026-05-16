export enum TokenType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  TRUE = "TRUE",
  FALSE = "FALSE",
  NULL = "NULL",
  LBRACE = "{",
  RBRACE = "}",
  LBRACKET = "[",
  RBRACKET = "]",
  COMMA = ",",
  COLON = ":",
  EOF = "EOF",
  INVALID = "INVALID",
}

export interface SourceLocation {
  first_line: number;
  last_line: number;
  first_column: number;
  last_column: number;
}

export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
}

export class LexerError extends Error {
  line: number;
  column: number;
  position: number;
  input: string;

  constructor(message: string, line: number, column: number, position: number, input: string) {
    super(message);
    this.name = "LexerError";
    this.line = line;
    this.column = column;
    this.position = position;
    this.input = input;
  }

  showPosition(): string {
    const lines = this.input.split("\n");
    const errorLine = lines[this.line - 1] || "";
    const before = errorLine.substring(Math.max(0, this.column - 20), this.column);
    const after = errorLine.substring(this.column, this.column + 20);
    const pad = new Array(before.length + 1).join("-");
    return before + after + "\n" + pad + "^";
  }
}

export class Lexer {
  private input: string = "";
  private pos: number = 0;
  private line: number = 1;
  private column: number = 0;

  setInput(input: string): void {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 0;
  }

  private peek(): string {
    return this.input[this.pos] ?? "";
  }

  private advance(): string {
    const ch = this.input[this.pos];
    this.pos++;
    if (ch === "\n") {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    return ch ?? "";
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        this.advance();
      } else {
        break;
      }
    }
  }

  private readString(): Token {
    const startLine = this.line;
    const startCol = this.column;
    this.advance(); // consume opening "

    let value = "";
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];

      // Reject unescaped control characters
      if (ch.charCodeAt(0) >= 0x00 && ch.charCodeAt(0) <= 0x1f) {
        if (ch === "\n" || ch === "\r") {
          throw new LexerError(
            `Lexical error on line ${this.line}. Bad string: unterminated string.\n${this.showPositionAt(startLine, startCol)}`,
            this.line,
            this.column,
            this.pos,
            this.input,
          );
        }
        throw new LexerError(
          `Lexical error on line ${this.line}. Bad string: control character in string.\n${this.showPositionAt(this.line, this.column)}`,
          this.line,
          this.column,
          this.pos,
          this.input,
        );
      }

      if (ch === '"') {
        this.advance(); // consume closing "
        return {
          type: TokenType.STRING,
          value,
          loc: {
            first_line: startLine,
            last_line: this.line,
            first_column: startCol,
            last_column: this.column,
          },
        };
      }

      if (ch === "\\") {
        this.advance(); // consume backslash
        const escaped = this.input[this.pos];
        if (escaped === undefined) {
          throw new LexerError(
            `Lexical error on line ${this.line}. Bad string: unterminated escape sequence.\n${this.showPositionAt(this.line, this.column)}`,
            this.line,
            this.column,
            this.pos,
            this.input,
          );
        }

        switch (escaped) {
          case '"':
            value += '"';
            this.advance();
            break;
          case "\\":
            value += "\\";
            this.advance();
            break;
          case "/":
            value += "/";
            this.advance();
            break;
          case "b":
            value += "\b";
            this.advance();
            break;
          case "f":
            value += "\f";
            this.advance();
            break;
          case "n":
            value += "\n";
            this.advance();
            break;
          case "r":
            value += "\r";
            this.advance();
            break;
          case "t":
            value += "\t";
            this.advance();
            break;
          case "u": {
            this.advance(); // consume 'u'
            let hex = "";
            for (let i = 0; i < 4; i++) {
              const h = this.input[this.pos];
              if (h === undefined || !/[0-9a-fA-F]/.test(h)) {
                throw new LexerError(
                  `Lexical error on line ${this.line}. Bad string: invalid unicode escape.\n${this.showPositionAt(this.line, this.column)}`,
                  this.line,
                  this.column,
                  this.pos,
                  this.input,
                );
              }
              hex += h;
              this.advance();
            }
            value += String.fromCharCode(parseInt(hex, 16));
            break;
          }
          default:
            throw new LexerError(
              `Lexical error on line ${this.line}. Bad string: invalid escape character '\\${escaped}'.\n${this.showPositionAt(this.line, this.column)}`,
              this.line,
              this.column,
              this.pos,
              this.input,
            );
        }
        continue;
      }

      value += ch;
      this.advance();
    }

    throw new LexerError(
      `Lexical error on line ${this.line}. Bad string: unterminated string.\n${this.showPositionAt(startLine, startCol)}`,
      this.line,
      this.column,
      this.pos,
      this.input,
    );
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startCol = this.column;
    let numStr = "";

    // Optional negative sign
    if (this.peek() === "-") {
      numStr += this.advance();
    }

    // Integer part
    if (this.peek() === "0") {
      numStr += this.advance();
      // After a leading zero, the next character must not be a digit
      if (this.pos < this.input.length && /[0-9]/.test(this.peek())) {
        throw new LexerError(
          `Lexical error on line ${this.line}. Bad number: leading zeros are not allowed.\n${this.showPositionAt(this.line, this.column)}`,
          this.line,
          this.column,
          this.pos,
          this.input,
        );
      }
    } else if (/[1-9]/.test(this.peek())) {
      numStr += this.advance();
      while (this.pos < this.input.length && /[0-9]/.test(this.peek())) {
        numStr += this.advance();
      }
    } else {
      throw new LexerError(
        `Lexical error on line ${this.line}. Bad number: expected digit.\n${this.showPositionAt(this.line, this.column)}`,
        this.line,
        this.column,
        this.pos,
        this.input,
      );
    }

    // Fractional part
    if (this.peek() === ".") {
      numStr += this.advance();
      if (!/[0-9]/.test(this.peek())) {
        throw new LexerError(
          `Lexical error on line ${this.line}. Bad number: expected digit after decimal point.\n${this.showPositionAt(this.line, this.column)}`,
          this.line,
          this.column,
          this.pos,
          this.input,
        );
      }
      while (this.pos < this.input.length && /[0-9]/.test(this.peek())) {
        numStr += this.advance();
      }
    }

    // Exponent part
    if (this.peek() === "e" || this.peek() === "E") {
      numStr += this.advance();
      if (this.peek() === "+" || this.peek() === "-") {
        numStr += this.advance();
      }
      if (!/[0-9]/.test(this.peek())) {
        throw new LexerError(
          `Lexical error on line ${this.line}. Bad number: expected digit in exponent.\n${this.showPositionAt(this.line, this.column)}`,
          this.line,
          this.column,
          this.pos,
          this.input,
        );
      }
      while (this.pos < this.input.length && /[0-9]/.test(this.peek())) {
        numStr += this.advance();
      }
    }

    return {
      type: TokenType.NUMBER,
      value: numStr,
      loc: {
        first_line: startLine,
        last_line: this.line,
        first_column: startCol,
        last_column: this.column,
      },
    };
  }

  private readKeyword(expected: string, tokenType: TokenType): Token {
    const startLine = this.line;
    const startCol = this.column;
    for (let i = 0; i < expected.length; i++) {
      if (this.pos >= this.input.length || this.input[this.pos] !== expected[i]) {
        throw new LexerError(
          `Lexical error on line ${this.line}. Unrecognized text.\n${this.showPositionAt(this.line, this.column)}`,
          this.line,
          this.column,
          this.pos,
          this.input,
        );
      }
      this.advance();
    }
    return {
      type: tokenType,
      value: expected,
      loc: {
        first_line: startLine,
        last_line: this.line,
        first_column: startCol,
        last_column: this.column,
      },
    };
  }

  private showPositionAt(line: number, col: number): string {
    const lines = this.input.split("\n");
    const errorLine = lines[line - 1] || "";
    const before = errorLine.substring(Math.max(0, col - 20), col);
    const after = errorLine.substring(col, col + 20);
    const pad = new Array(before.length + 1).join("-");
    return before + after + "\n" + pad + "^";
  }

  nextToken(): Token {
    this.skipWhitespace();

    if (this.pos >= this.input.length) {
      return {
        type: TokenType.EOF,
        value: "",
        loc: {
          first_line: this.line,
          last_line: this.line,
          first_column: this.column,
          last_column: this.column,
        },
      };
    }

    const ch = this.peek();
    const startLine = this.line;
    const startCol = this.column;

    switch (ch) {
      case "{":
        this.advance();
        return {
          type: TokenType.LBRACE,
          value: "{",
          loc: {
            first_line: startLine,
            last_line: this.line,
            first_column: startCol,
            last_column: this.column,
          },
        };
      case "}":
        this.advance();
        return {
          type: TokenType.RBRACE,
          value: "}",
          loc: {
            first_line: startLine,
            last_line: this.line,
            first_column: startCol,
            last_column: this.column,
          },
        };
      case "[":
        this.advance();
        return {
          type: TokenType.LBRACKET,
          value: "[",
          loc: {
            first_line: startLine,
            last_line: this.line,
            first_column: startCol,
            last_column: this.column,
          },
        };
      case "]":
        this.advance();
        return {
          type: TokenType.RBRACKET,
          value: "]",
          loc: {
            first_line: startLine,
            last_line: this.line,
            first_column: startCol,
            last_column: this.column,
          },
        };
      case ",":
        this.advance();
        return {
          type: TokenType.COMMA,
          value: ",",
          loc: {
            first_line: startLine,
            last_line: this.line,
            first_column: startCol,
            last_column: this.column,
          },
        };
      case ":":
        this.advance();
        return {
          type: TokenType.COLON,
          value: ":",
          loc: {
            first_line: startLine,
            last_line: this.line,
            first_column: startCol,
            last_column: this.column,
          },
        };
      case '"':
        return this.readString();
      case "t":
        return this.readKeyword("true", TokenType.TRUE);
      case "f":
        return this.readKeyword("false", TokenType.FALSE);
      case "n":
        return this.readKeyword("null", TokenType.NULL);
      case "-":
        return this.readNumber();
      default:
        if (/[0-9]/.test(ch)) {
          return this.readNumber();
        }
        throw new LexerError(
          `Lexical error on line ${this.line}. Unrecognized text.\n${this.showPositionAt(this.line, this.column)}`,
          this.line,
          this.column,
          this.pos,
          this.input,
        );
    }
  }
}
