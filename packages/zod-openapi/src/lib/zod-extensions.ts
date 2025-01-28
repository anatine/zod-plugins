/*
This code is heavily inspired by https://github.com/asteasolutions/zod-to-openapi/blob/master/src/zod-extensions.ts
 */

import { AnatineSchemaObject, extendApi } from './zod-openapi';
import {z} from "zod";
import {ZodTypeDef} from "zod";


declare module 'zod' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface ZodSchema<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
    openapi<T extends ZodSchema<Output, Def, Input>>(
      this: T,
      metadata: Partial<AnatineSchemaObject>
    ): T;
  }
}

export function extendZodWithOpenApi(zod: typeof z, forceOverride = false) {
  if (!forceOverride && typeof zod.ZodSchema.prototype.openapi !== 'undefined') {
    // This zod instance is already extended with the required methods,
    // doing it again will just result in multiple wrapper methods for
    // `optional` and `nullable`
    return;
  }

  zod.ZodSchema.prototype.openapi = function (
    metadata?: Partial<AnatineSchemaObject>
  ) {
      return extendApi(this, metadata)
  }
}
