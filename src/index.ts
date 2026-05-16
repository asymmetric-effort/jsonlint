export { JsonParser, parse, ParseError } from "./parser.js";
export { Lexer, LexerError, TokenType } from "./lexer.js";
export type { Token, SourceLocation } from "./lexer.js";
export type { ParseErrorHash } from "./parser.js";
export { formatJson } from "./formatter.js";
export { SchemaValidator } from "./schema.js";
export type { JsonSchema, SchemaError } from "./schema.js";
export { main } from "./cli.js";

// zaach/jsonlint compat: singleton parser instance
import { JsonParser } from "./parser.js";
export const parser = new JsonParser();

// zaach/jsonlint compat: formatter namespace
import { formatJson } from "./formatter.js";
export const formatter = { formatJson };
