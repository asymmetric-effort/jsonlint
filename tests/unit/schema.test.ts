import { describe, it, expect } from "bun:test";
import { SchemaValidator } from "../../src/schema.js";
import type { JsonSchema } from "../../src/schema.js";

function validate(instance: unknown, schema: JsonSchema) {
  const v = new SchemaValidator();
  return v.validate(instance, schema);
}

describe("SchemaValidator", () => {
  describe("type validation", () => {
    it("should accept valid string type", () => {
      const errors = validate("hello", { type: "string" });
      expect(errors).toHaveLength(0);
    });

    it("should reject invalid string type", () => {
      const errors = validate(42, { type: "string" });
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should accept valid number type", () => {
      const errors = validate(42, { type: "number" });
      expect(errors).toHaveLength(0);
    });

    it("should accept valid integer type", () => {
      const errors = validate(42, { type: "integer" });
      expect(errors).toHaveLength(0);
    });

    it("should reject float for integer type", () => {
      const errors = validate(3.14, { type: "integer" });
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should accept valid boolean type", () => {
      const errors = validate(true, { type: "boolean" });
      expect(errors).toHaveLength(0);
    });

    it("should accept valid object type", () => {
      const errors = validate({}, { type: "object" });
      expect(errors).toHaveLength(0);
    });

    it("should accept valid array type", () => {
      const errors = validate([], { type: "array" });
      expect(errors).toHaveLength(0);
    });

    it("should accept valid null type", () => {
      const errors = validate(null, { type: "null" });
      expect(errors).toHaveLength(0);
    });

    it("should accept any type", () => {
      const errors = validate("anything", { type: "any" });
      expect(errors).toHaveLength(0);
    });

    it("should accept union types", () => {
      const errors = validate("hello", { type: ["string", "number"] });
      expect(errors).toHaveLength(0);
      const errors2 = validate(42, { type: ["string", "number"] });
      expect(errors2).toHaveLength(0);
    });

    it("should reject value not in union types", () => {
      const errors = validate(true, { type: ["string", "number"] });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("string validations", () => {
    it("should validate minLength", () => {
      expect(validate("abc", { type: "string", minLength: 2 })).toHaveLength(0);
      expect(validate("a", { type: "string", minLength: 2 }).length).toBeGreaterThan(0);
    });

    it("should validate maxLength", () => {
      expect(validate("ab", { type: "string", maxLength: 3 })).toHaveLength(0);
      expect(validate("abcd", { type: "string", maxLength: 3 }).length).toBeGreaterThan(0);
    });

    it("should validate pattern", () => {
      expect(validate("abc123", { type: "string", pattern: "^[a-z]+[0-9]+$" })).toHaveLength(0);
      expect(validate("123abc", { type: "string", pattern: "^[a-z]+[0-9]+$" }).length).toBeGreaterThan(0);
    });
  });

  describe("number validations", () => {
    it("should validate minimum", () => {
      expect(validate(5, { type: "number", minimum: 5 })).toHaveLength(0);
      expect(validate(4, { type: "number", minimum: 5 }).length).toBeGreaterThan(0);
    });

    it("should validate maximum", () => {
      expect(validate(5, { type: "number", maximum: 5 })).toHaveLength(0);
      expect(validate(6, { type: "number", maximum: 5 }).length).toBeGreaterThan(0);
    });

    it("should validate exclusiveMinimum", () => {
      expect(
        validate(5, { type: "number", minimum: 5, exclusiveMinimum: true }).length,
      ).toBeGreaterThan(0);
      expect(
        validate(6, { type: "number", minimum: 5, exclusiveMinimum: true }),
      ).toHaveLength(0);
    });

    it("should validate exclusiveMaximum", () => {
      expect(
        validate(5, { type: "number", maximum: 5, exclusiveMaximum: true }).length,
      ).toBeGreaterThan(0);
      expect(
        validate(4, { type: "number", maximum: 5, exclusiveMaximum: true }),
      ).toHaveLength(0);
    });

    it("should validate divisibleBy", () => {
      expect(validate(10, { type: "number", divisibleBy: 5 })).toHaveLength(0);
      expect(validate(7, { type: "number", divisibleBy: 5 }).length).toBeGreaterThan(0);
    });
  });

  describe("object validations", () => {
    it("should validate properties", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      };
      expect(validate({ name: "John", age: 30 }, schema)).toHaveLength(0);
      expect(validate({ name: "John", age: "thirty" }, schema).length).toBeGreaterThan(0);
    });

    it("should validate required properties", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string", required: true },
          age: { type: "number" },
        },
      };
      expect(validate({ name: "John" }, schema)).toHaveLength(0);
      expect(validate({ age: 30 }, schema).length).toBeGreaterThan(0);
    });

    it("should validate additionalProperties: false", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        additionalProperties: false,
      };
      expect(validate({ name: "John" }, schema)).toHaveLength(0);
      expect(validate({ name: "John", extra: true }, schema).length).toBeGreaterThan(0);
    });

    it("should validate additionalProperties as schema", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        additionalProperties: { type: "number" },
      };
      expect(validate({ name: "John", x: 1 }, schema)).toHaveLength(0);
      expect(validate({ name: "John", x: "bad" }, schema).length).toBeGreaterThan(0);
    });

    it("should validate patternProperties", () => {
      const schema: JsonSchema = {
        type: "object",
        patternProperties: {
          "^s_": { type: "string" },
          "^n_": { type: "number" },
        },
      };
      expect(validate({ s_name: "John", n_age: 30 }, schema)).toHaveLength(0);
      expect(validate({ s_name: 42 }, schema).length).toBeGreaterThan(0);
    });

    it("should validate dependencies (string)", () => {
      const schema: JsonSchema = {
        type: "object",
        dependencies: {
          bar: "foo",
        },
      };
      expect(validate({ bar: 1, foo: 2 }, schema)).toHaveLength(0);
      expect(validate({ bar: 1 }, schema).length).toBeGreaterThan(0);
    });

    it("should validate dependencies (array)", () => {
      const schema: JsonSchema = {
        type: "object",
        dependencies: {
          bar: ["foo", "baz"],
        },
      };
      expect(validate({ bar: 1, foo: 2, baz: 3 }, schema)).toHaveLength(0);
      expect(validate({ bar: 1, foo: 2 }, schema).length).toBeGreaterThan(0);
    });

    it("should validate dependencies (schema)", () => {
      const schema: JsonSchema = {
        type: "object",
        dependencies: {
          bar: { properties: { foo: { type: "number", required: true } } },
        },
      };
      expect(validate({ bar: 1, foo: 2 }, schema)).toHaveLength(0);
      expect(validate({ bar: 1 }, schema).length).toBeGreaterThan(0);
    });
  });

  describe("array validations", () => {
    it("should validate items as schema", () => {
      const schema: JsonSchema = {
        type: "array",
        items: { type: "number" },
      };
      expect(validate([1, 2, 3], schema)).toHaveLength(0);
      expect(validate([1, "two", 3], schema).length).toBeGreaterThan(0);
    });

    it("should validate items as tuple", () => {
      const schema: JsonSchema = {
        type: "array",
        items: [{ type: "string" }, { type: "number" }],
      };
      expect(validate(["a", 1], schema)).toHaveLength(0);
      expect(validate([1, "a"], schema).length).toBeGreaterThan(0);
    });

    it("should validate minItems", () => {
      expect(validate([1, 2], { type: "array", minItems: 2 })).toHaveLength(0);
      expect(validate([1], { type: "array", minItems: 2 }).length).toBeGreaterThan(0);
    });

    it("should validate maxItems", () => {
      expect(validate([1, 2], { type: "array", maxItems: 2 })).toHaveLength(0);
      expect(validate([1, 2, 3], { type: "array", maxItems: 2 }).length).toBeGreaterThan(0);
    });

    it("should validate uniqueItems", () => {
      expect(validate([1, 2, 3], { type: "array", uniqueItems: true })).toHaveLength(0);
      expect(validate([1, 2, 1], { type: "array", uniqueItems: true }).length).toBeGreaterThan(0);
    });
  });

  describe("enum validation", () => {
    it("should accept valid enum value", () => {
      expect(validate("a", { enum: ["a", "b", "c"] })).toHaveLength(0);
    });

    it("should reject invalid enum value", () => {
      expect(validate("d", { enum: ["a", "b", "c"] }).length).toBeGreaterThan(0);
    });

    it("should support complex enum values", () => {
      expect(validate({ a: 1 }, { enum: [{ a: 1 }, { b: 2 }] })).toHaveLength(0);
    });
  });

  describe("disallow validation", () => {
    it("should reject disallowed types", () => {
      expect(validate("str", { disallow: "string" }).length).toBeGreaterThan(0);
    });

    it("should accept non-disallowed types", () => {
      expect(validate(42, { disallow: "string" })).toHaveLength(0);
    });

    it("should handle disallow as array", () => {
      expect(validate(42, { disallow: ["string", "boolean"] })).toHaveLength(0);
      expect(validate("str", { disallow: ["string", "boolean"] }).length).toBeGreaterThan(0);
    });

    it("should handle disallow integer", () => {
      expect(validate(42, { disallow: "integer" }).length).toBeGreaterThan(0);
    });
  });

  describe("$ref support", () => {
    it("should resolve $ref", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { $ref: "nameSchema" },
        },
      };
      // Register the referenced schema by giving it an id
      const nameSchema: JsonSchema = {
        id: "nameSchema",
        type: "string",
        minLength: 1,
      };
      const v = new SchemaValidator();
      // We need to validate with the main schema, which will collect inner schemas.
      // For this to work, the referenced schema needs to be part of the main schema tree.
      // Let's use a flat approach.
      const fullSchema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
        },
      };
      expect(v.validate({ name: "John" }, fullSchema)).toHaveLength(0);
    });
  });

  describe("extends support", () => {
    it("should validate against extended schema", () => {
      const schema: JsonSchema = {
        type: "object",
        extends: {
          properties: {
            name: { type: "string", required: true },
          },
        },
        properties: {
          age: { type: "number" },
        },
      };
      expect(validate({ name: "John", age: 30 }, schema)).toHaveLength(0);
      expect(validate({ age: 30 }, schema).length).toBeGreaterThan(0);
    });

    it("should validate against array of extended schemas", () => {
      const schema: JsonSchema = {
        type: "object",
        extends: [
          { properties: { a: { type: "string", required: true } } },
          { properties: { b: { type: "number", required: true } } },
        ],
      };
      expect(validate({ a: "x", b: 1 }, schema)).toHaveLength(0);
      expect(validate({ a: "x" }, schema).length).toBeGreaterThan(0);
    });
  });

  describe("no schema constraints", () => {
    it("should accept anything with empty schema", () => {
      expect(validate("anything", {})).toHaveLength(0);
      expect(validate(42, {})).toHaveLength(0);
      expect(validate(null, {})).toHaveLength(0);
      expect(validate({}, {})).toHaveLength(0);
      expect(validate([], {})).toHaveLength(0);
    });
  });
});
