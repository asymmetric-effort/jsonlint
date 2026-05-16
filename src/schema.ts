/**
 * Minimal JSON Schema Draft-03 validator.
 * Zero dependencies — implements the subset needed for feature parity with jsonlint.
 */

export interface SchemaError {
  property: string;
  message: string;
}

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  required?: boolean;
  additionalProperties?: boolean | JsonSchema;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  enum?: unknown[];
  default?: unknown;
  description?: string;
  title?: string;
  $ref?: string;
  id?: string;
  extends?: JsonSchema | JsonSchema[];
  disallow?: string | string[];
  divisibleBy?: number;
  format?: string;
  patternProperties?: Record<string, JsonSchema>;
  dependencies?: Record<string, string | string[] | JsonSchema>;
  [key: string]: unknown;
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }

  return false;
}

export class SchemaValidator {
  private schemas: Map<string, JsonSchema> = new Map();
  private errors: SchemaError[] = [];

  validate(instance: unknown, schema: JsonSchema, path: string = ""): SchemaError[] {
    this.errors = [];
    this.collectSchemas(schema, "");
    this.doValidate(instance, schema, path);
    return this.errors;
  }

  private collectSchemas(schema: JsonSchema, basePath: string): void {
    if (schema.id) {
      this.schemas.set(schema.id, schema);
    }
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        this.collectSchemas(prop, `${basePath}/properties/${key}`);
      }
    }
    if (schema.items && !Array.isArray(schema.items)) {
      this.collectSchemas(schema.items, `${basePath}/items`);
    }
  }

  private resolveRef(ref: string): JsonSchema | null {
    return this.schemas.get(ref) || null;
  }

  private addError(path: string, message: string): void {
    this.errors.push({ property: path, message });
  }

  private doValidate(instance: unknown, schema: JsonSchema, path: string): void {
    if (schema.$ref) {
      const resolved = this.resolveRef(schema.$ref);
      if (resolved) {
        this.doValidate(instance, resolved, path);
      }
      return;
    }

    // Handle extends
    if (schema.extends) {
      const extList = Array.isArray(schema.extends) ? schema.extends : [schema.extends];
      for (const ext of extList) {
        this.doValidate(instance, ext, path);
      }
    }

    // Type check
    if (schema.type !== undefined) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      const actualType = getType(instance);
      const typeMatch = types.some((t) => {
        if (t === "any") return true;
        if (t === "integer") return actualType === "number" && Number.isInteger(instance as number);
        if (t === "number") return actualType === "number";
        return t === actualType;
      });

      if (!typeMatch) {
        this.addError(path, `Expected type ${types.join(" or ")} but found type ${actualType}`);
        return;
      }
    }

    // Disallow
    if (schema.disallow !== undefined) {
      const disallowed = Array.isArray(schema.disallow) ? schema.disallow : [schema.disallow];
      const actualType = getType(instance);
      if (disallowed.some((t) => {
        if (t === "integer") return actualType === "number" && Number.isInteger(instance as number);
        return t === actualType;
      })) {
        this.addError(path, `Type ${actualType} is disallowed`);
      }
    }

    // Enum
    if (schema.enum !== undefined) {
      if (!schema.enum.some((e) => deepEqual(e, instance))) {
        this.addError(path, `Value ${JSON.stringify(instance)} is not one of the allowed enum values`);
      }
    }

    // String validations
    if (typeof instance === "string") {
      if (schema.minLength !== undefined && instance.length < schema.minLength) {
        this.addError(path, `String is too short (${instance.length} < ${schema.minLength})`);
      }
      if (schema.maxLength !== undefined && instance.length > schema.maxLength) {
        this.addError(path, `String is too long (${instance.length} > ${schema.maxLength})`);
      }
      if (schema.pattern !== undefined) {
        const re = new RegExp(schema.pattern);
        if (!re.test(instance)) {
          this.addError(path, `String does not match pattern: ${schema.pattern}`);
        }
      }
    }

    // Number validations
    if (typeof instance === "number") {
      if (schema.minimum !== undefined) {
        if (schema.exclusiveMinimum) {
          if (instance <= schema.minimum) {
            this.addError(path, `Value ${instance} must be greater than ${schema.minimum}`);
          }
        } else {
          if (instance < schema.minimum) {
            this.addError(path, `Value ${instance} must be at least ${schema.minimum}`);
          }
        }
      }
      if (schema.maximum !== undefined) {
        if (schema.exclusiveMaximum) {
          if (instance >= schema.maximum) {
            this.addError(path, `Value ${instance} must be less than ${schema.maximum}`);
          }
        } else {
          if (instance > schema.maximum) {
            this.addError(path, `Value ${instance} must be at most ${schema.maximum}`);
          }
        }
      }
      if (schema.divisibleBy !== undefined && schema.divisibleBy !== 0) {
        if (instance % schema.divisibleBy !== 0) {
          this.addError(path, `Value ${instance} is not divisible by ${schema.divisibleBy}`);
        }
      }
    }

    // Object validations
    if (typeof instance === "object" && instance !== null && !Array.isArray(instance)) {
      const obj = instance as Record<string, unknown>;
      const objKeys = Object.keys(obj);

      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const propPath = path ? `${path}.${key}` : key;

          if (key in obj) {
            this.doValidate(obj[key], propSchema, propPath);
          } else if (propSchema.required === true) {
            this.addError(propPath, `Property is required`);
          }
        }
      }

      // Pattern properties
      if (schema.patternProperties) {
        for (const [pattern, propSchema] of Object.entries(schema.patternProperties)) {
          const re = new RegExp(pattern);
          for (const key of objKeys) {
            if (re.test(key)) {
              const propPath = path ? `${path}.${key}` : key;
              this.doValidate(obj[key], propSchema, propPath);
            }
          }
        }
      }

      // Additional properties
      if (schema.additionalProperties !== undefined) {
        const knownKeys = new Set<string>();
        if (schema.properties) {
          for (const key of Object.keys(schema.properties)) {
            knownKeys.add(key);
          }
        }
        if (schema.patternProperties) {
          for (const pattern of Object.keys(schema.patternProperties)) {
            const re = new RegExp(pattern);
            for (const key of objKeys) {
              if (re.test(key)) knownKeys.add(key);
            }
          }
        }

        for (const key of objKeys) {
          if (!knownKeys.has(key)) {
            if (schema.additionalProperties === false) {
              const propPath = path ? `${path}.${key}` : key;
              this.addError(propPath, `Additional property not allowed`);
            } else if (typeof schema.additionalProperties === "object") {
              const propPath = path ? `${path}.${key}` : key;
              this.doValidate(obj[key], schema.additionalProperties, propPath);
            }
          }
        }
      }

      // Dependencies
      if (schema.dependencies) {
        for (const [key, dep] of Object.entries(schema.dependencies)) {
          if (key in obj) {
            if (typeof dep === "string") {
              if (!(dep in obj)) {
                this.addError(path, `Property ${key} requires ${dep}`);
              }
            } else if (Array.isArray(dep)) {
              for (const d of dep) {
                if (!(d in obj)) {
                  this.addError(path, `Property ${key} requires ${d}`);
                }
              }
            } else {
              this.doValidate(instance, dep, path);
            }
          }
        }
      }
    }

    // Array validations
    if (Array.isArray(instance)) {
      if (schema.minItems !== undefined && instance.length < schema.minItems) {
        this.addError(path, `Array has too few items (${instance.length} < ${schema.minItems})`);
      }
      if (schema.maxItems !== undefined && instance.length > schema.maxItems) {
        this.addError(path, `Array has too many items (${instance.length} > ${schema.maxItems})`);
      }
      if (schema.uniqueItems === true) {
        for (let i = 0; i < instance.length; i++) {
          for (let j = i + 1; j < instance.length; j++) {
            if (deepEqual(instance[i], instance[j])) {
              this.addError(path, `Array items must be unique (duplicate at index ${j})`);
            }
          }
        }
      }
      if (schema.items) {
        if (Array.isArray(schema.items)) {
          for (let i = 0; i < instance.length; i++) {
            if (i < schema.items.length) {
              this.doValidate(instance[i], schema.items[i], `${path}[${i}]`);
            }
          }
        } else {
          for (let i = 0; i < instance.length; i++) {
            this.doValidate(instance[i], schema.items, `${path}[${i}]`);
          }
        }
      }
    }
  }
}
