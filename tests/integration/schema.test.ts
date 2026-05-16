import { describe, it, expect } from "bun:test";
import { parse } from "../../src/parser.js";
import { SchemaValidator } from "../../src/schema.js";
import type { JsonSchema } from "../../src/schema.js";

describe("Integration: Schema validation with parsed JSON", () => {
  it("should validate a parsed object against a schema", () => {
    const json = '{"name": "Alice", "age": 30}';
    const parsed = parse(json);

    const schema: JsonSchema = {
      type: "object",
      properties: {
        name: { type: "string", required: true },
        age: { type: "integer", minimum: 0 },
      },
    };

    const v = new SchemaValidator();
    const errors = v.validate(parsed, schema);
    expect(errors).toHaveLength(0);
  });

  it("should report errors for invalid parsed data", () => {
    const json = '{"name": 42, "age": -5}';
    const parsed = parse(json);

    const schema: JsonSchema = {
      type: "object",
      properties: {
        name: { type: "string", required: true },
        age: { type: "integer", minimum: 0 },
      },
    };

    const v = new SchemaValidator();
    const errors = v.validate(parsed, schema);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it("should validate array items", () => {
    const json = "[1, 2, 3, 4, 5]";
    const parsed = parse(json);

    const schema: JsonSchema = {
      type: "array",
      items: { type: "integer", minimum: 1, maximum: 5 },
    };

    const v = new SchemaValidator();
    const errors = v.validate(parsed, schema);
    expect(errors).toHaveLength(0);
  });

  it("should validate complex nested structure", () => {
    const json = '{"users": [{"name": "Alice", "active": true}, {"name": "Bob", "active": false}]}';
    const parsed = parse(json);

    const schema: JsonSchema = {
      type: "object",
      properties: {
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", required: true },
              active: { type: "boolean", required: true },
            },
            additionalProperties: false,
          },
        },
      },
    };

    const v = new SchemaValidator();
    const errors = v.validate(parsed, schema);
    expect(errors).toHaveLength(0);
  });
});
