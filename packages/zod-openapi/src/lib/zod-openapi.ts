import type {SchemaObject, SchemaObjectType} from 'openapi3-ts/oas31';
import merge from 'ts-deepmerge';
import {AnyZodObject, z, ZodTypeAny} from 'zod';

export interface OpenApiZodAny extends ZodTypeAny {
  metaOpenApi?: SchemaObject | SchemaObject[];
}

interface OpenApiZodAnyObject extends AnyZodObject {
  metaOpenApi?: SchemaObject | SchemaObject[];
}

interface ParsingArgs<T> {
  zodRef: T;
  schemas: SchemaObject[];
  useOutput?: boolean;
}

export function extendApi<T extends OpenApiZodAny>(
  schema: T,
  SchemaObject: SchemaObject = {}
): T {
  schema.metaOpenApi = Object.assign(schema.metaOpenApi || {}, SchemaObject);
  return schema;
}

function iterateZodObject({
  zodRef,
  useOutput,
}: ParsingArgs<OpenApiZodAnyObject>) {
  return Object.keys(zodRef.shape).reduce(
    (carry, key) => ({
      ...carry,
      [key]: generateSchema(zodRef.shape[key], useOutput),
    }),
    {} as Record<string, SchemaObject>
  );
}

function parseTransformation({
  zodRef,
  schemas,
  useOutput,
}: ParsingArgs<z.ZodTransformer<never> | z.ZodEffects<never>>): SchemaObject {
  const input = generateSchema(zodRef._def.schema, useOutput);

  let output = 'undefined';
  if (useOutput && zodRef._def.effect) {
    const effect =
      zodRef._def.effect.type === 'transform' ? zodRef._def.effect : null;
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
            : undefined,
          { addIssue: () => undefined, path: [] } // TODO: Discover if context is necessary here
        );
      } catch (e) {
        /**/
      }
    }
  }
  return merge(
    {
      ...(zodRef.description ? { description: zodRef.description } : {}),
      ...input,
      ...(['number', 'string', 'boolean', 'null'].includes(output)
        ? {
            type: output as 'number' | 'string' | 'boolean' | 'null',
          }
        : {}),
    },
    ...schemas
  );
}

function parseString({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodString>): SchemaObject {
  const baseSchema: SchemaObject = {
    type: 'string',
  };
  const { checks = [] } = zodRef._def;
  checks.forEach((item) => {
    switch (item.kind) {
      case 'email':
        baseSchema.format = 'email';
        break;
      case 'uuid':
        baseSchema.format = 'uuid';
        break;
      case 'cuid':
        baseSchema.format = 'cuid';
        break;
      case 'url':
        baseSchema.format = 'uri';
        break;
      case 'datetime':
        baseSchema.format = 'date-time';
        break;
      case 'length':
        baseSchema.minLength = item.value;
        baseSchema.maxLength = item.value;
        break;
      case 'max':
        baseSchema.maxLength = item.value;
        break;
      case 'min':
        baseSchema.minLength = item.value;
        break;
      case 'regex':
        baseSchema.pattern = item.regex.source;
        break;
    }
  });
  return merge(
    baseSchema,
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseNumber({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodNumber>): SchemaObject {
  const baseSchema: SchemaObject = {
    type: 'number',
  };
  const { checks = [] } = zodRef._def;
  checks.forEach((item) => {
    switch (item.kind) {
      case 'max':
        baseSchema.maximum = item.value;
        // TODO: option to make this always explicit? (false instead of non-existent)
        if (!item.inclusive) baseSchema.exclusiveMaximum = item.value;
        break;
      case 'min':
        baseSchema.minimum = item.value;
        if (!item.inclusive) baseSchema.exclusiveMinimum = item.value;
        break;
      case 'int':
        baseSchema.type = 'integer';
        break;
      case 'multipleOf':
        baseSchema.multipleOf = item.value;
    }
  });
  return merge(
    baseSchema,
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseObject({
  zodRef,
  schemas,
  useOutput,
}: ParsingArgs<
  z.ZodObject<never, 'passthrough' | 'strict' | 'strip'>
>): SchemaObject {
  let additionalProperties: SchemaObject['additionalProperties'];

  // `catchall` obviates `strict`, `strip`, and `passthrough`
  if (
    !(
      zodRef._def.catchall instanceof z.ZodNever ||
      zodRef._def.catchall?._def.typeName === 'ZodNever'
    )
  )
    additionalProperties = generateSchema(zodRef._def.catchall, useOutput);
  else if (zodRef._def.unknownKeys === 'passthrough')
    additionalProperties = true;
  else if (zodRef._def.unknownKeys === 'strict') additionalProperties = false;

  // So that `undefined` values don't end up in the schema and be weird
  additionalProperties =
    additionalProperties != null ? { additionalProperties } : {};

  const requiredProperties = Object.keys(
    (zodRef as z.AnyZodObject).shape
  ).filter((key) => {
    const item = (zodRef as z.AnyZodObject).shape[key];
    return (
      !(
        item.isOptional() ||
        item instanceof z.ZodDefault ||
        item._def.typeName === 'ZodDefault'
      ) && !(item instanceof z.ZodNever || item._def.typeName === 'ZodDefault')
    );
  });

  const required =
    requiredProperties.length > 0 ? { required: requiredProperties } : {};

  return merge(
    {
      type: 'object' as SchemaObjectType,
      properties: iterateZodObject({
        zodRef: zodRef as OpenApiZodAnyObject,
        schemas,
        useOutput,
      }),
      ...required,
      ...additionalProperties,
    },
    zodRef.description ? {description: zodRef.description} : {},
    ...schemas
  );
}

function parseRecord({
  zodRef,
  schemas,
  useOutput,
}: ParsingArgs<z.ZodRecord>): SchemaObject {
  return merge(
    {
      type: 'object' as SchemaObjectType,
      additionalProperties:
        zodRef._def.valueType instanceof z.ZodUnknown
          ? {}
          : generateSchema(zodRef._def.valueType, useOutput),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseBigInt({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodBigInt>): SchemaObject {
  return merge(
    { type: 'integer' as SchemaObjectType, format: 'int64' },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseBoolean({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodBoolean>): SchemaObject {
  return merge(
    { type: 'boolean' as SchemaObjectType },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseDate({ zodRef, schemas }: ParsingArgs<z.ZodDate>): SchemaObject {
  return merge(
    { type: 'string' as SchemaObjectType, format: 'date-time' },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseNull({ zodRef, schemas }: ParsingArgs<z.ZodNull>): SchemaObject {
  return merge(
    {
      type: 'string' as SchemaObjectType,
      format: 'null',
      nullable: true,
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseOptionalNullable({
  schemas,
  zodRef,
  useOutput,
}: ParsingArgs<
  z.ZodOptional<OpenApiZodAny> | z.ZodNullable<OpenApiZodAny>
>): SchemaObject {
  return merge(
    generateSchema(zodRef.unwrap(), useOutput),
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseDefault({
  schemas,
  zodRef,
  useOutput,
}: ParsingArgs<z.ZodDefault<OpenApiZodAny>>): SchemaObject {
  return merge(
    {
      default: zodRef._def.defaultValue(),
      ...generateSchema(zodRef._def.innerType, useOutput),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseArray({
  schemas,
  zodRef,
  useOutput,
}: ParsingArgs<z.ZodArray<OpenApiZodAny>>): SchemaObject {
  const constraints: SchemaObject = {};
  if (zodRef._def.exactLength != null) {
    constraints.minItems = zodRef._def.exactLength.value;
    constraints.maxItems = zodRef._def.exactLength.value;
  }

  if (zodRef._def.minLength != null)
    constraints.minItems = zodRef._def.minLength.value;
  if (zodRef._def.maxLength != null)
    constraints.maxItems = zodRef._def.maxLength.value;

  return merge(
    {
      type: 'array' as SchemaObjectType,
      items: generateSchema(zodRef.element, useOutput),
      ...constraints,
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseLiteral({
  schemas,
  zodRef,
}: ParsingArgs<z.ZodLiteral<OpenApiZodAny>>): SchemaObject {
  return merge(
    {
      type: typeof zodRef._def.value as 'string' | 'number' | 'boolean',
      enum: [zodRef._def.value],
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseEnum({
  schemas,
  zodRef,
}: ParsingArgs<z.ZodEnum<never> | z.ZodNativeEnum<never>>): SchemaObject {
  return merge(
    {
      type: typeof Object.values(zodRef._def.values)[0] as 'string' | 'number',
      enum: Object.values(zodRef._def.values),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseIntersection({
  schemas,
  zodRef,
  useOutput,
}: ParsingArgs<z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>>): SchemaObject {
  return merge(
    {
      allOf: [
        generateSchema(zodRef._def.left, useOutput),
        generateSchema(zodRef._def.right, useOutput),
      ],
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseUnion({
  schemas,
  zodRef,
  useOutput,
}: ParsingArgs<z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]>>): SchemaObject {
  return merge(
    {
      oneOf: (
        zodRef as z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]>
      )._def.options.map((schema) => generateSchema(schema, useOutput)),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseDiscriminatedUnion({
  schemas,
  zodRef,
  useOutput,
}: ParsingArgs<
  z.ZodDiscriminatedUnion<string, z.ZodDiscriminatedUnionOption<string>[]>
>): SchemaObject {
  return merge(
    {
      discriminator: {
        propertyName: (
          zodRef as z.ZodDiscriminatedUnion<
            string,
            z.ZodDiscriminatedUnionOption<string>[]
          >
        )._def.discriminator,
      },
      oneOf: Array.from(
        (
          zodRef as z.ZodDiscriminatedUnion<
            string,
            z.ZodDiscriminatedUnionOption<string>[]
          >
        )._def.options.values()
      ).map((schema) => generateSchema(schema, useOutput)),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseNever({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodNever>): SchemaObject {
  return merge(
    { readOnly: true },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseBranded({
  schemas,
  zodRef,
}: ParsingArgs<z.ZodBranded<z.ZodAny, string>>): SchemaObject {
  return merge(generateSchema(zodRef._def.type), ...schemas);
}

function catchAllParser({
  zodRef,
  schemas,
}: ParsingArgs<ZodTypeAny>): SchemaObject {
  return merge(
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

const workerMap = {
  ZodObject: parseObject,
  ZodRecord: parseRecord,
  ZodString: parseString,
  ZodNumber: parseNumber,
  ZodBigInt: parseBigInt,
  ZodBoolean: parseBoolean,
  ZodDate: parseDate,
  ZodNull: parseNull,
  ZodOptional: parseOptionalNullable,
  ZodNullable: parseOptionalNullable,
  ZodDefault: parseDefault,
  ZodArray: parseArray,
  ZodLiteral: parseLiteral,
  ZodEnum: parseEnum,
  ZodNativeEnum: parseEnum,
  ZodTransformer: parseTransformation,
  ZodEffects: parseTransformation,
  ZodIntersection: parseIntersection,
  ZodUnion: parseUnion,
  ZodDiscriminatedUnion: parseDiscriminatedUnion,
  ZodNever: parseNever,
  ZodBranded: parseBranded,
  // TODO Transform the rest to schemas
  ZodUndefined: catchAllParser,
  // TODO: `prefixItems` is allowed in OpenAPI 3.1 which can be used to create tuples
  ZodTuple: catchAllParser,
  ZodMap: catchAllParser,
  ZodFunction: catchAllParser,
  ZodLazy: catchAllParser,
  ZodPromise: catchAllParser,
  ZodAny: catchAllParser,
  ZodUnknown: catchAllParser,
  ZodVoid: catchAllParser,
};
type WorkerKeys = keyof typeof workerMap;

export function generateSchema(
  zodRef: OpenApiZodAny,
  useOutput?: boolean
): SchemaObject {
  const { metaOpenApi = {} } = zodRef;
  const schemas = [
    zodRef.isNullable && zodRef.isNullable() ? { nullable: true } : {},
    ...(Array.isArray(metaOpenApi) ? metaOpenApi : [metaOpenApi]),
  ];

  try {
    const typeName = zodRef._def.typeName as WorkerKeys;
    if (typeName in workerMap) {
      return workerMap[typeName]({
        zodRef: zodRef as never,
        schemas,
        useOutput,
      });
    }

    return catchAllParser({ zodRef, schemas });
  } catch (err) {
    console.error(err);
    return catchAllParser({ zodRef, schemas });
  }
}
