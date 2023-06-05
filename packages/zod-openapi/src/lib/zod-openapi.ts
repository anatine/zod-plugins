import type {ReferenceObject, SchemaObject, SchemaObjectType} from 'openapi3-ts/oas31';
import merge from 'ts-deepmerge';
import {AnyZodObject, z, ZodTypeAny} from 'zod';

type SchemaObjectWithName = SchemaObject & {[fragmentName]?: string};

export interface OpenApiZodAny extends ZodTypeAny {
  metaOpenApi?: SchemaObjectWithName | SchemaObjectWithName[];
}

interface OpenApiZodAnyObject extends AnyZodObject {
  metaOpenApi?: SchemaObjectWithName | SchemaObjectWithName[];
}

interface ParsingArgs<T> {
  zodRef: T;
  schemas: SchemaObjectWithName[];
  options?: {useOutput?: boolean; vocabulary?: Set<string>;}
}

export function extendApi<T extends OpenApiZodAny>(
  schema: T,
  schemaObject: SchemaObjectWithName = {}
): T {
  schema.metaOpenApi = Object.assign(schema.metaOpenApi || {}, schemaObject);
  return schema;
}

function iterateZodObject({
  zodRef,
  options,
}: ParsingArgs<OpenApiZodAnyObject>) {
  return Object.keys(zodRef.shape).reduce(
    (carry, key) => ({
      ...carry,
      [key]: generateSchema(zodRef.shape[key], options),
    }),
    {} as Record<string, SchemaObject | ReferenceObject>
  );
}

function dropFragmentNames(schemas: SchemaObjectWithName[]) {
  return schemas.map(schema => ({...schema, [fragmentName]: undefined}));
}

function parseTransformation({
  zodRef,
  schemas,
  options,
}: ParsingArgs<z.ZodTransformer<never> | z.ZodEffects<never>>): SchemaObject {
  // we need to get the specific schema for the transformation
  const input = generateSchema(zodRef._def.schema, {...options, vocabulary: undefined}) as SchemaObject;

  let output = 'undefined';
  if (options?.useOutput && zodRef._def.effect) {
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
    ...dropFragmentNames(schemas)
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
    ...dropFragmentNames(schemas)
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
    ...dropFragmentNames(schemas)
  );
}

function parseObject({
  zodRef,
  schemas,
  options,
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
    additionalProperties = generateSchema(zodRef._def.catchall, options);
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
        options,
      }),
      ...required,
      ...additionalProperties,
    },
    zodRef.description ? {description: zodRef.description} : {},
    ...dropFragmentNames(schemas)
  );
}

function parseRecord({
  zodRef,
  schemas,
  options,
}: ParsingArgs<z.ZodRecord>): SchemaObject {
  return merge(
    {
      type: 'object' as SchemaObjectType,
      additionalProperties:
        zodRef._def.valueType instanceof z.ZodUnknown
          ? {}
          : generateSchema(zodRef._def.valueType, options),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseBigInt({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodBigInt>): SchemaObject {
  return merge(
    { type: 'integer' as SchemaObjectType, format: 'int64' },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseBoolean({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodBoolean>): SchemaObject {
  return merge(
    { type: 'boolean' as SchemaObjectType },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseDate({ zodRef, schemas }: ParsingArgs<z.ZodDate>): SchemaObject {
  return merge(
    { type: 'string' as SchemaObjectType, format: 'date-time' },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
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
    ...dropFragmentNames(schemas)
  );
}

function parseOptionalNullable({
  schemas,
  zodRef,
  options,
}: ParsingArgs<
  z.ZodOptional<OpenApiZodAny> | z.ZodNullable<OpenApiZodAny>
>): SchemaObject {
  return merge(
    generateSchema(zodRef.unwrap(), options),
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseDefault({
  schemas,
  zodRef,
  options,
}: ParsingArgs<z.ZodDefault<OpenApiZodAny>>): SchemaObject {
  return merge(
    {
      default: zodRef._def.defaultValue(),
      ...generateSchema(zodRef._def.innerType, options),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseArray({
  schemas,
  zodRef,
  options,
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
      items: generateSchema(zodRef.element, options),
      ...constraints,
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
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
    ...dropFragmentNames(schemas)
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
    ...dropFragmentNames(schemas)
  );
}

function parseIntersection({
  schemas,
  zodRef,
  options,
}: ParsingArgs<z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>>): SchemaObject {
  return merge(
    {
      allOf: [
        generateSchema(zodRef._def.left, options),
        generateSchema(zodRef._def.right, options),
      ],
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseUnion({
  schemas,
  zodRef,
  options,
}: ParsingArgs<z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]>>): SchemaObject {
  const contents = zodRef._def.options;
  if (contents.reduce((prev, content) => prev && content._def.typeName === 'ZodLiteral', true)) {
    // special case to transform unions of literals into enums
    const literals = contents as unknown as z.ZodLiteral<OpenApiZodAny>[];
    const type = literals
      .reduce((prev, content) =>
        !prev || prev === typeof content._def.value ?
          typeof content._def.value :
          null,
        null as null | string
      );

    if (type) {
      return merge(
        {
          type: type as 'string' | 'number' | 'boolean',
          enum: literals.map((literal) => literal._def.value)
        },
        zodRef.description ? { description: zodRef.description } : {},
        ...schemas
      );
    }
  }

  return merge(
    {
      oneOf: contents.map((schema) => generateSchema(schema, options)),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseDiscriminatedUnion({
  schemas,
  zodRef,
  options,
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
      ).map((schema) => generateSchema(schema, options)),
    },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseNever({
  zodRef,
  schemas,
}: ParsingArgs<z.ZodNever>): SchemaObject {
  return merge(
    { readOnly: true },
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
  );
}

function parseBranded({
  schemas,
  zodRef,
}: ParsingArgs<z.ZodBranded<z.ZodAny, string>>): SchemaObject {
  return merge(generateSchema(zodRef._def.type), ...dropFragmentNames(schemas));
}

function catchAllParser({
  zodRef,
  schemas,
}: ParsingArgs<ZodTypeAny>): SchemaObject {
  return merge(
    zodRef.description ? { description: zodRef.description } : {},
    ...dropFragmentNames(schemas)
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

function getSchemasForZodObject(zodRef: OpenApiZodAny): SchemaObjectWithName[] {
  const { metaOpenApi = {} } = zodRef;
  return [
    zodRef.isNullable && zodRef.isNullable() ? { nullable: true } : {},
    ...(Array.isArray(metaOpenApi) ? metaOpenApi : [metaOpenApi]),
  ];
}

function getNameFromSchemas(schemas: SchemaObjectWithName[]): string | undefined {
  return schemas.reduce(
    (prev, schema) => prev || schema[fragmentName], undefined as string | undefined
  );
}

export function generateSchema(zodRef: OpenApiZodAny): SchemaObject;
export function generateSchema(zodRef: OpenApiZodAny, options?: {useOutput?: boolean, vocabulary?: Set<string>}): SchemaObject | ReferenceObject;
/**
 * @deprecated Use generateSchema(zodRef, {useOutput}) instead.
 */
export function generateSchema(zodRef: OpenApiZodAny, useOutput: boolean): SchemaObject;
export function generateSchema(
  zodRef: OpenApiZodAny,
  second?: {useOutput?: boolean, vocabulary?: Set<string>} | boolean
): SchemaObject | ReferenceObject {
  const options = typeof second === 'boolean' ? {useOutput: second} : second;
  const schemas = getSchemasForZodObject(zodRef);
  const name = getNameFromSchemas(schemas);

  if (name && options?.vocabulary?.has(name)) {
    return {
      '$ref': `#/components/schemas/${name}`
    };
  }

  try {
    const typeName = zodRef._def.typeName as WorkerKeys;
    if (typeName in workerMap) {
      return workerMap[typeName]({
        zodRef: zodRef as never,
        schemas,
        options,
      });
    }

    return catchAllParser({ zodRef, schemas, options });
  } catch (err) {
    console.error(err);
    return catchAllParser({ zodRef, schemas, options });
  }
}

export const fragmentName = Symbol('fragmentName');

export function generateVocabulary(objects: OpenApiZodAny[]): [SchemaObject[], Set<string>] {
  const fragments = objects.filter(object => getNameFromSchemas(getSchemasForZodObject(object)));
  const fragmentNames = new Set(fragments.map(
    object => getNameFromSchemas(getSchemasForZodObject(object)) as string
  ));
  const fragmentSchemas = fragments.map(fragment => {
    const name = getNameFromSchemas(getSchemasForZodObject(fragment)) as string;
    fragmentNames.delete(name);
    // assumption: schemas cannot have 2 different names
    const schema = generateSchema(fragment, { vocabulary: fragmentNames }) as SchemaObject;
    fragmentNames.add(name);

    return schema;
  });

  return [fragmentSchemas, fragmentNames];
}
