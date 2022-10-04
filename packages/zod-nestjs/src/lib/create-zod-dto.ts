import { generateSchema, OpenApiZodAny } from '@anatine/zod-openapi';
import { SchemaObject } from 'openapi3-ts';
import * as z from 'zod';
/**
 * This file was originally taken from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/createZodDto.ts
 *
 * It is used to create a DTO from a Zod object.
 * I assume that the create method is called within NestJS.
 */

/**
 * ZodType is a very complex interface describing not just public properties but private ones as well
 * causing the interface to change fairly often among versions
 *
 * Since we're interested in the main subset of Zod functionality (type inferring + parsing) this type is introduced
 * to achieve the most compatibility.
 */
export type CompatibleZodType = Pick<
  z.ZodType<unknown>,
  '_input' | '_output' | 'parse' | 'safeParse'
>;
export type CompatibleZodInfer<T extends CompatibleZodType> = T['_output'];

export type ZodDtoStatic<T extends CompatibleZodType = CompatibleZodType> = {
  new (): CompatibleZodInfer<T>;
  zodSchema: T;
  create(input: unknown): CompatibleZodInfer<T>;
  _OPENAPI_METADATA_FACTORY(): Record<string, SchemaObject> | undefined;
};

// Used for transforming the SchemaObject in _OPENAPI_METADATA_FACTORY
type SchemaObjectForMetadataFactory = Omit<SchemaObject, 'required'>;

export const createZodDto = <T extends CompatibleZodType>(
  zodSchema: T & OpenApiZodAny,
): ZodDtoStatic<T> => {
  class SchemaHolderClass {
    public static zodSchema = zodSchema;

    /** Found from METADATA_FACTORY_NAME
      * in Nestjs swagger module.
      * https://github.com/nestjs/swagger/blob/491b168cbff3003191e55ee96e77e69d8c1deb66/lib/type-helpers/mapped-types.utils.ts
      * METADATA_FACTORY_NAME is defined here as '_OPENAPI_METADATA_FACTORY' here:
      * https://github.com/nestjs/swagger/blob/491b168cbff3003191e55ee96e77e69d8c1deb66/lib/plugin/plugin-constants.ts
    */
    public static _OPENAPI_METADATA_FACTORY(): Record<string, SchemaObject> | undefined {
      const generatedSchema = generateSchema(zodSchema);
      const properties = generatedSchema.properties ?? {};
      for (const key in properties) {
        /** For some reason the SchemaObject model has everything except for the
         * required field, which is an array.
         * The NestJS swagger module requires this to be a boolean representative
         * of each property.
         * This logic takes the SchemaObject, and turns the required field from an 
         * array to a boolean.
         */
        const schemaObject = properties[key] as SchemaObjectForMetadataFactory;
        const schemaObjectWithRequiredField = {
          ...schemaObject
        }
        if (
          (generatedSchema.required !== undefined,
          generatedSchema.required?.includes(key))
        ) {
          schemaObjectWithRequiredField.required = true;
        } else {
          schemaObjectWithRequiredField.required = false;
        }
        properties[key] = schemaObjectWithRequiredField;
      }
      return properties;
    }

    public static create(input: unknown): CompatibleZodInfer<T> {
      return this.zodSchema.parse(input);
    }
  }

  return SchemaHolderClass;
};