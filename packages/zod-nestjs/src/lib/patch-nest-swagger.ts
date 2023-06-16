/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

/**
 * This file was copied from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/OpenApi/patchNestjsSwagger.ts
 */
import {generateSchema} from '@anatine/zod-openapi';
import type {SchemaObject} from 'openapi3-ts/oas30';

interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export const patchNestjsSwagger = (
  schemaObjectFactoryModule = require('@nestjs/swagger/dist/services/schema-object-factory')
): void => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/naming-convention
  const { SchemaObjectFactory } = schemaObjectFactoryModule;

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
    if (this.isLazyTypeFunc(type)) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      type = (type as Function)();
    }

    if (!type.zodSchema) {
      return orgExploreModelSchema.call(this, type, schemas, schemaRefsStack);
    }

    schemas[type.name] = generateSchema(type.zodSchema);

    return type.name;
  };
};
