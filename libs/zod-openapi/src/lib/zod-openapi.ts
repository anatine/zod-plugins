// Refactor of  https://github.com/RobinTail/express-zod-api/blob/1fa5991ec12aa461506887ef7de7882d7afe3b48/src/open-api.ts

import { SchemaObject } from 'openapi3-ts';
import merge from 'ts-deepmerge';
import { AnyZodObject, z, ZodTypeAny } from 'zod';

export interface OpenApiZodAny extends ZodTypeAny {
  metaOpenApi?: SchemaObject;
}
export interface OpenApiZodAnyObject extends AnyZodObject {
  metaOpenApi?: SchemaObject;
}

export function openApi<T extends OpenApiZodAny>(
  schema: T,
  SchemaObject: SchemaObject = {}
): T {
  schema.metaOpenApi = SchemaObject;
  return schema;
}

function parseZodTransformation(
  value: z.ZodTransformer<never> | z.ZodEffects<never>,
  useOutput = false
) {
  const input = generateSchema(value._def.schema, useOutput);

  let output = 'undefined';
  if (useOutput && value._def.effects && value._def.effects.length > 0) {
    const effect = value._def.effects
      .filter((ef) => ef.type === 'transform')
      .slice(-1)[0];
    if (effect && 'transform' in effect) {
      try {
        output = typeof effect.transform(
          ['integer', 'number'].includes(`${input.type}`)
            ? 0
            : 'string' === input.type
            ? ''
            : 'boolean' === input.type
            ? false
            : 'object' === input.type
            ? {}
            : 'null' === input.type
            ? null
            : 'array' === input.type
            ? []
            : undefined
        );
      } catch (e) {
        /**/
      }
    }
  }
  return {
    ...input,
    ...(['number', 'string', 'boolean', 'null'].includes(output)
      ? {
          type: output as 'number' | 'string' | 'boolean' | 'null',
        }
      : {}),
  };
}

function iterateZodObject(
  schema: OpenApiZodAnyObject,
  useOutput = false
): Record<string, SchemaObject> {
  return Object.keys(schema.shape).reduce(
    (carry, key) => ({
      ...carry,
      [key]: generateSchema(schema.shape[key], useOutput),
    }),
    {} as Record<string, SchemaObject>
  );
}

function parseZodString(item: z.ZodString, metaSchema: SchemaObject = {}) {
  const baseSchema: SchemaObject = {
    type: 'string',
  };
  if (item.isNullable()) {
    baseSchema.nullable = true;
  }
  const { checks = [] } = item._def;
  checks.forEach((item) => {
    switch (item.kind) {
      case 'email':
        baseSchema.format = 'email';
        break;
      case 'uuid':
        baseSchema.format = 'uuid';
        break;
      case 'url':
        baseSchema.format = 'uri';
        break;
      case 'max':
        baseSchema.maxLength = item.value;
        break;
      case 'min':
        baseSchema.minLength = item.value;
        break;
      case 'regex':
        baseSchema.regex = item.regex;
        break;
    }
  });
  return merge(baseSchema, metaSchema);
}

function parseZodNumber(item: z.ZodNumber, metaSchema: SchemaObject = {}) {
  const baseSchema: SchemaObject = {
    type: 'number',
  };
  if (item.isNullable()) {
    baseSchema.nullable = true;
  }
  const { checks = [] } = item._def;
  checks.forEach((item) => {
    switch (item.kind) {
      case 'max':
        baseSchema.maximum = item.value - (item.inclusive ? 0 : 1);
        break;
      case 'min':
        baseSchema.minimum = item.value + (item.inclusive ? 0 : 1);
        break;
      case 'int':
        baseSchema.type = 'integer';
        break;
    }
  });
  return merge(baseSchema, metaSchema);
}

export function generateSchema(
  zodRef: OpenApiZodAny,
  useOutput = false
): SchemaObject {
  const metaSchema = zodRef.metaOpenApi ?? {};
  const baseSchema: SchemaObject = {};

  if (zodRef.isNullable()) {
    baseSchema.nullable = true;
  }

  switch (true) {
    case zodRef instanceof z.ZodObject:
    case zodRef instanceof z.ZodRecord:
      return merge(
        {
          type: 'object',
          properties: iterateZodObject(
            zodRef as OpenApiZodAnyObject,
            useOutput
          ),
          required: Object.keys((zodRef as z.AnyZodObject).shape).filter(
            (key) =>
              !(zodRef as z.AnyZodObject).shape[key].isOptional() &&
              !((zodRef as z.AnyZodObject).shape[key] instanceof z.ZodNever)
          ),
        },
        metaSchema
      );
    case zodRef instanceof z.ZodString:
      return parseZodString(zodRef as z.ZodString, metaSchema);
    case zodRef instanceof z.ZodNumber:
      return parseZodNumber(zodRef as z.ZodNumber, metaSchema);
    case zodRef instanceof z.ZodBigInt:
      return merge(
        baseSchema,
        { type: 'integer', format: 'int64' },
        metaSchema
      );
    case zodRef instanceof z.ZodBoolean:
      return merge(baseSchema, { type: 'boolean' }, metaSchema);
    case zodRef instanceof z.ZodDate:
      return merge(
        baseSchema,
        { type: 'string', format: 'date-time' },
        metaSchema
      );
    case zodRef instanceof z.ZodNull:
      return merge(
        baseSchema,
        {
          type: 'string',
          format: 'null',
          nullable: true,
        },
        metaSchema
      );
    case zodRef instanceof z.ZodOptional:
    case zodRef instanceof z.ZodNullable:
      return merge(
        baseSchema,
        generateSchema(
          (
            zodRef as
              | z.ZodOptional<OpenApiZodAny>
              | z.ZodNullable<OpenApiZodAny>
          ).unwrap()
        )
      );
    case zodRef instanceof z.ZodArray:
      return merge(
        baseSchema,
        {
          type: 'array',
          items: generateSchema((zodRef._def as z.ZodArrayDef).type, useOutput),
        },
        metaSchema
      );
    case zodRef instanceof z.ZodLiteral:
      return merge(
        baseSchema,
        {
          type: typeof zodRef._def.value as 'string' | 'number' | 'boolean',
          enum: [zodRef._def.value],
        },
        metaSchema
      );
    case zodRef instanceof z.ZodEnum:
    case zodRef instanceof z.ZodNativeEnum:
      return merge(
        baseSchema,
        {
          type: typeof Object.values(zodRef._def.values)[0] as
            | 'string'
            | 'number',
          enum: Object.values(zodRef._def.values),
        },
        metaSchema
      );
    case zodRef instanceof z.ZodTransformer:
    case zodRef instanceof z.ZodEffects:
      return merge(
        baseSchema,
        parseZodTransformation(
          zodRef as z.ZodEffects<never> | z.ZodTransformer<never>,
          useOutput
        ),
        metaSchema
      );
    case zodRef instanceof z.ZodIntersection:
      return merge(
        baseSchema,
        {
          allOf: [
            generateSchema(
              (zodRef as z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>)._def
                .left,
              useOutput
            ),
            generateSchema(
              (zodRef as z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>)._def
                .right,
              useOutput
            ),
          ],
        },
        metaSchema
      );
    case zodRef instanceof z.ZodUnion:
      return merge(
        baseSchema,
        {
          oneOf: (
            zodRef as z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]>
          )._def.options.map((schema) => generateSchema(schema, useOutput)),
        },
        metaSchema
      );
    case zodRef instanceof z.ZodNever:
      return merge(baseSchema, { readOnly: true }, metaSchema);
    case zodRef instanceof z.ZodUndefined:
    case zodRef instanceof z.ZodTuple:
    case zodRef instanceof z.ZodMap:
    case zodRef instanceof z.ZodFunction:
    case zodRef instanceof z.ZodLazy:
    case zodRef instanceof z.ZodPromise:
    case zodRef instanceof z.ZodAny:
    case zodRef instanceof z.ZodUnknown:
    case zodRef instanceof z.ZodVoid:
    default:
      return merge(baseSchema, metaSchema);
  }
}
