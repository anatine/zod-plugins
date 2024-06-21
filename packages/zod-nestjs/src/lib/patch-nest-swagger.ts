/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

/**
 * This file was copied from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/OpenApi/patchNestjsSwagger.ts
 */
import {generateSchema} from '@anatine/zod-openapi';
import type {SchemaObject} from 'openapi3-ts/oas31';

interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

type SchemaObjectFactoryModule =
  typeof import('@nestjs/swagger/dist/services/schema-object-factory');

export const patchNestjsSwagger = (
  schemaObjectFactoryModule: SchemaObjectFactoryModule | undefined = undefined,
  openApiVersion: '3.0' | '3.1' = '3.0'
): void => {
  const { SchemaObjectFactory } = (schemaObjectFactoryModule ??
    require('@nestjs/swagger/dist/services/schema-object-factory')) as SchemaObjectFactoryModule;

  const orgExploreModelSchema =
    SchemaObjectFactory.prototype.exploreModelSchema;

  SchemaObjectFactory.prototype.exploreModelSchema = function (
    type: Type<unknown> | Function | any,
    schemas: any | Record<string, SchemaObject>,
    schemaRefsStack: string[] = []
    // type: Type<unknown> | Function | any,
    // schemas: Record<string, SchemaObject>,
    // schemaRefsStack: string[] = []
  ) {
    // @ts-expect-error Reported as private, but since we are patching, we will be able to reach it
    if (this.isLazyTypeFunc(type)) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      type = (type as Function)();
    }

    if (!type.zodSchema) {
      return orgExploreModelSchema.call(this, type, schemas, schemaRefsStack);
    }

    schemas[type.name] = generateSchema(type.zodSchema, false, openApiVersion);

    return type.name;
  };
};
