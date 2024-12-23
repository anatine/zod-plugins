import type { SchemaObject, SchemaObjectType } from 'openapi3-ts/oas31';
import merge from 'ts-deepmerge';
import { AnyZodObject, z, ZodTypeAny } from 'zod';

type AnatineSchemaObject = SchemaObject & { hideDefinitions?: string[] };

export interface OpenApiZodAny extends ZodTypeAny {
  metaOpenApi?: AnatineSchemaObject | AnatineSchemaObject[];
}

interface OpenApiZodAnyObject extends AnyZodObject {
  metaOpenApi?: AnatineSchemaObject | AnatineSchemaObject[];
}

type OpenAPIVersion = '3.0' | '3.1';

interface ParsingArgs<T> {
  zodRef: T;
  schemas: AnatineSchemaObject[];
  useOutput?: boolean;
  hideDefinitions?: string[];
  openApiVersion: OpenAPIVersion;
}

export function extendApi<T extends OpenApiZodAny>(
  schema: T,
  schemaObject: AnatineSchemaObject = {}
): T {
  const This = (schema as any).constructor;
  const newSchema = new This(schema._def);
  newSchema.metaOpenApi = Object.assign(
    {},
    schema.metaOpenApi || {},
    schemaObject
  );
  return newSchema;
}

function iterateZodObject({
  zodRef,
  useOutput,
  hideDefinitions,
  openApiVersion,
}: ParsingArgs<OpenApiZodAnyObject>) {
  const reduced = Object.keys(zodRef.shape)
    .filter((key) => hideDefinitions?.includes(key) === false)
    .reduce(
      (carry, key) => ({
        ...carry,
        [key]: generateSchema(zodRef.shape[key], useOutput, openApiVersion),
      }),
      {} as Record<string, SchemaObject>
    );

  return reduced;
}

function typeFormat<const T extends SchemaObjectType>(type: T, openApiVersion: OpenAPIVersion) {
  return openApiVersion === '3.0' ? type : [type];
}

function parseTransformation({
  zodRef,
  schemas,
  useOutput,
  openApiVersion,
}: ParsingArgs<z.ZodTransformer<never> | z.ZodEffects<never>>): SchemaObject {
  const input = generateSchema(zodRef._def.schema, useOutput, openApiVersion);

  let output = 'undefined';
  if (useOutput && zodRef._def.effect) {
    const effect =
      zodRef._def.effect.type === 'transform' ? zodRef._def.effect : null;
    if (effect && 'transform' in effect) {
      try {
        const type = Array.isArray(input.type) ? input.type[0] : input.type;
        output = typeof effect.transform(
          ['integer', 'number'].includes(`${type}`)
            ? 0
            : 'string' === type
              ? ''
              : 'boolean' === type
                ? false
                : 'object' === type
                  ? {}
                  : 'null' === type
                    ? null
                    : 'array' === type
                      ? []
                      : undefined,
          { addIssue: () => undefined, path: [] } // TODO: Discover if context is necessary here
        );
      } catch (e) {
        /**/
      }
    }
  }
  const outputType = output as 'number' | 'string' | 'boolean' | 'null'
  return merge(
    {
      ...(zodRef.description ? { description: zodRef.description } : {}),
      ...input,
      ...(['number', 'string', 'boolean', 'null'].includes(output)
        ? {
          type: typeFormat(outputType, openApiVersion),
        }
        : {}),
    },
    ...schemas
  );
}

function parseString({
  zodRef,
  schemas,
  openApiVersion,
}: ParsingArgs<z.ZodString>): SchemaObject {
  const baseSchema: SchemaObject = {
    type: typeFormat('string', openApiVersion),
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
  openApiVersion,
}: ParsingArgs<z.ZodNumber>): SchemaObject {
  const baseSchema: SchemaObject = {
    type: typeFormat('number', openApiVersion),
  };
  const { checks = [] } = zodRef._def;
  checks.forEach((item) => {
    switch (item.kind) {
      case 'max':
        if (item.inclusive) baseSchema.maximum = item.value;
        else baseSchema.exclusiveMaximum = item.value;
        break;
      case 'min':
        if (item.inclusive) baseSchema.minimum = item.value;
        else baseSchema.exclusiveMinimum = item.value;
        break;
      case 'int':
        baseSchema.type = typeFormat('integer', openApiVersion);
        break;
      case 'multipleOf':
        baseSchema.multipleOf = item.value;
        break;
    }
  });
  return merge(
    baseSchema,
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}



function getExcludedDefinitionsFromSchema(schemas: AnatineSchemaObject[]): string[] {


  const excludedDefinitions = [];
  for (const schema of schemas) {
    if (Array.isArray(schema.hideDefinitions)) {
      excludedDefinitions.push(...schema.hideDefinitions)
    }
  }

  return excludedDefinitions
}

function parseObject({
  zodRef,
  schemas,
  useOutput,
  hideDefinitions,
  openApiVersion,
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
    additionalProperties = generateSchema(zodRef._def.catchall, useOutput, openApiVersion);
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
      type: typeFormat('object', openApiVersion),
      properties: iterateZodObject({
        zodRef: zodRef as OpenApiZodAnyObject,
        schemas,
        useOutput,
        hideDefinitions: getExcludedDefinitionsFromSchema(schemas),
        openApiVersion,
      }),
      ...required,
      ...additionalProperties,
      ...hideDefinitions
    },
    zodRef.description ? { description: zodRef.description, hideDefinitions } : {},
    ...schemas
  );
}

function parseRecord({
  zodRef,
  schemas,
  useOutput,
  openApiVersion,
}: ParsingArgs<z.ZodRecord>): SchemaObject {
  return merge(
    {
      type: typeFormat('object', openApiVersion),
      additionalProperties:
        zodRef._def.valueType instanceof z.ZodUnknown
          ? {}
          : generateSchema(zodRef._def.valueType, useOutput, openApiVersion),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseBigInt({
  zodRef,
  schemas,
  openApiVersion,
}: ParsingArgs<z.ZodBigInt>): SchemaObject {
  return merge(
    { 
      type: typeFormat('integer', openApiVersion),
      format: 'int64'
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseBoolean({
  zodRef,
  schemas,
  openApiVersion,
}: ParsingArgs<z.ZodBoolean>): SchemaObject {
  return merge(
    { type: typeFormat('boolean', openApiVersion) },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseDate({ zodRef, schemas, openApiVersion }: ParsingArgs<z.ZodDate>): SchemaObject {
  return merge(
    {
      type: typeFormat('string', openApiVersion),
      format: 'date-time'
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseNull({ zodRef, schemas, openApiVersion }: ParsingArgs<z.ZodNull>): SchemaObject {
  return merge(
    openApiVersion === '3.0' ? { type: 'null' as SchemaObjectType } : {
      type: ['string', 'null'] as SchemaObjectType[],
      enum: ['null'],
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseOptional({
  schemas,
  zodRef,
  useOutput,
  openApiVersion,
}: ParsingArgs<z.ZodOptional<OpenApiZodAny>>): SchemaObject {
  return merge(
    generateSchema(zodRef.unwrap(), useOutput, openApiVersion),
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseNullable({
  schemas,
  zodRef,
  useOutput,
  openApiVersion,
}: ParsingArgs<z.ZodNullable<OpenApiZodAny>>): SchemaObject {
  const schema = generateSchema(zodRef.unwrap(), useOutput, openApiVersion);
  return merge(
    schema,
    openApiVersion === '3.0'
      ? { nullable: true }
      : { type: typeFormat('null', openApiVersion) },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseDefault({
  schemas,
  zodRef,
  useOutput,
  openApiVersion,
}: ParsingArgs<z.ZodDefault<OpenApiZodAny>>): SchemaObject {
  return merge(
    {
      default: zodRef._def.defaultValue(),
      ...generateSchema(zodRef._def.innerType, useOutput, openApiVersion),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseArray({
  schemas,
  zodRef,
  useOutput,
  openApiVersion,
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
      type: typeFormat('array', openApiVersion),
      items: generateSchema(zodRef.element, useOutput, openApiVersion),
      ...constraints,
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseLiteral({
  schemas,
  zodRef,
  openApiVersion,
}: ParsingArgs<z.ZodLiteral<OpenApiZodAny>>): SchemaObject {
  const type = typeof zodRef._def.value as 'string' | 'number' | 'boolean'
  return merge(
    {
      type: typeFormat(type, openApiVersion),
      enum: [zodRef._def.value],
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseEnum({
  schemas,
  zodRef,
  openApiVersion,
}: ParsingArgs<z.ZodEnum<never> | z.ZodNativeEnum<never>>): SchemaObject {
  const type = typeof Object.values(zodRef._def.values)[0] as 'string' | 'number'
  return merge(
    {
      type: typeFormat(type, openApiVersion),
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
  openApiVersion,
}: ParsingArgs<z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>>): SchemaObject {
  return merge(
    {
      allOf: [
        generateSchema(zodRef._def.left, useOutput, openApiVersion),
        generateSchema(zodRef._def.right, useOutput, openApiVersion),
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
  openApiVersion,
}: ParsingArgs<z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]>>): SchemaObject {
  const contents = zodRef._def.options;
  if (
    contents.reduce(
      (prev, content) => prev && content._def.typeName === 'ZodLiteral',
      true
    )
  ) {
    // special case to transform unions of literals into enums
    const literals = contents as unknown as z.ZodLiteral<OpenApiZodAny>[];
    const type = literals.reduce(
      (prev, content) =>
        !prev || prev === typeof content._def.value
          ? typeof content._def.value
          : null,
      null as null | string
    );

    if (type) {
      return merge(
        {
          type: typeFormat(type as SchemaObjectType, openApiVersion),
          enum: literals.map((literal) => literal._def.value),
        },
        zodRef.description ? { description: zodRef.description } : {},
        ...schemas
      );
    }
  }

  const oneOfContents =
    openApiVersion === '3.0'
      ? contents.filter((content) => content._def.typeName !== 'ZodNull')
      : contents;
  const contentsHasNull = contents.length != oneOfContents.length;

  return merge(
    {
      oneOf: oneOfContents.map((schema) => generateSchema(schema, useOutput, openApiVersion)),
    },
    contentsHasNull ? { nullable: true } : {},
    zodRef.description ? { description: zodRef.description } : {},
    ...schemas
  );
}

function parseDiscriminatedUnion({
  schemas,
  zodRef,
  useOutput,
  openApiVersion,
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
      ).map((schema) => generateSchema(schema, useOutput, openApiVersion)),
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
  useOutput,
  openApiVersion,
}: ParsingArgs<z.ZodBranded<z.ZodAny, string>>): SchemaObject {
  return merge(generateSchema(zodRef._def.type, useOutput, openApiVersion), ...schemas);
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

function parsePipeline({
  schemas,
  zodRef,
  useOutput,
  openApiVersion,
}: ParsingArgs<z.ZodPipeline<never, never>>): SchemaObject {
  return merge(
    generateSchema(useOutput ? zodRef._def.out : zodRef._def.in, useOutput, openApiVersion),
    ...schemas,
  );
}

function parseReadonly({
  zodRef,
  useOutput,
  schemas,
  openApiVersion,
}: ParsingArgs<z.ZodReadonly<z.ZodAny>>): SchemaObject {
  return merge(
    generateSchema(zodRef._def.innerType, useOutput, openApiVersion),
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
  ZodOptional: parseOptional,
  ZodNullable: parseNullable,
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
  ZodPipeline: parsePipeline,
  ZodReadonly: parseReadonly,
};
type WorkerKeys = keyof typeof workerMap;

export function generateSchema(
  zodRef: OpenApiZodAny,
  useOutput = false,
  openApiVersion: OpenAPIVersion = '3.1',
): SchemaObject {
  const { metaOpenApi = {} } = zodRef;
  const schemas = [
    ...(Array.isArray(metaOpenApi) ? metaOpenApi : [metaOpenApi]),
  ];
  try {
    const typeName = zodRef._def.typeName as WorkerKeys;
    if (typeName in workerMap) {
      return workerMap[typeName]({
        zodRef: zodRef as never,
        schemas,
        useOutput,
        openApiVersion,
      });
    }

    return catchAllParser({ zodRef, schemas, openApiVersion });
  } catch (err) {
    console.error(err);
    return catchAllParser({ zodRef, schemas, openApiVersion });
  }
}
