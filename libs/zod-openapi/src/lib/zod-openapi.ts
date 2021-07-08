import merge from 'ts-deepmerge';
import { z, ZodTypeAny, AnyZodObject } from 'zod';
import {
  OpenApiBuilder,
  OperationObject,
  SchemaObject,
  ReferenceObject,
} from 'openapi3-ts';

export type OpenApiZodAny = ZodTypeAny & { metaOpenApi?: SchemaObject };
export type OpenApiZodAnyObject = AnyZodObject & { metaOpenApi?: SchemaObject };

export function openApi<T extends OpenApiZodAny>(
  schema: T,
  SchemaObject: SchemaObject = {}
): T {
  schema.metaOpenApi = SchemaObject;
  return schema;
}

const MIME_TYPE_JSON = 'application/json';

function iterateZodObject(
  schema: OpenApiZodAnyObject
): Record<string, SchemaObject> {
  return Object.keys(schema.shape).reduce(
    (carry, key) => ({
      ...carry,
      [key]: generateSchema(schema.shape[key]),
    }),
    {} as Record<string, SchemaObject>
  );
}

export function generateSchema(zodRef: OpenApiZodAny): SchemaObject {
  const metaSchema = zodRef.metaOpenApi ?? {};

  // return {
  //   type: 'object',
  //   properties: {
  //     name: {
  //       type: 'string',
  //       description: 'User full name',
  //     },
  //   },
  // };

  switch (true) {
    case zodRef instanceof z.ZodObject:
      return merge(
        {
          type: 'object',
          properties: iterateZodObject(zodRef as OpenApiZodAnyObject),
        },
        metaSchema
      );
    case zodRef instanceof z.ZodString:
      return merge({ type: 'string' }, metaSchema);
    // case zodRef instanceof z.ZodNumber:
    //   return merge(metaSchema, { type: 'number' });
    // case zodRef instanceof z.ZodBigInt:
    //   return merge(metaSchema, { type: 'integer', format: 'int64' });
    // case zodRef instanceof z.ZodBoolean:
    //   return merge(metaSchema, { type: 'boolean' });
    // case zodRef instanceof z.ZodDate:
    //   return merge(metaSchema, { type: 'string', format: 'date-time' });
    // case zodRef instanceof z.ZodNull:
    //   return merge(metaSchema, {
    //     type: 'string',
    //     format: 'null',
    //     nullable: true,
    //   });
    default:
      return metaSchema;
  }
}

// export function zodOpenapi(): string {
//   return 'zod-openapi';
// }

// export function convertToSchemaObject(
//   zodRef: ZodTypeAny,
//   schemaObject: SchemaObject = {}
// ): SchemaObject {
//   if (zodRef.isNullable()) {
//     schemaObject.nullable = true;
//   }
// }
