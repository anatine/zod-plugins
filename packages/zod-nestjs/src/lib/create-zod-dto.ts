import type { SchemaObject, ReferenceObject } from 'openapi3-ts';
import { generateSchema, OpenApiZodAny } from '@anatine/zod-openapi';
import * as z from 'zod';

import type { TupleToUnion, Merge } from './types';

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

export type MergeZodSchemaOutput<T extends CompatibleZodType> =
  T extends z.ZodDiscriminatedUnion<string, infer Options>
    ? Merge<object, TupleToUnion<{[X in keyof Options]: Options[X] extends z.ZodType ? Options[X]['_output'] : Options[X]}>>
      : T extends z.ZodUnion<infer UnionTypes>
        ? UnionTypes extends z.ZodType[]
          ? Merge<object, TupleToUnion<{[X in keyof UnionTypes]: UnionTypes[X] extends z.ZodType ? UnionTypes[X]['_output'] : UnionTypes[X]}>>
          : T['_output']
        : T['_output'];

export type ZodDtoStatic<T extends CompatibleZodType = CompatibleZodType> = {
  new (): MergeZodSchemaOutput<T>;
  zodSchema: T;
  create(input: unknown): CompatibleZodInfer<T>;
};

// Used for transforming the SchemaObject in _OPENAPI_METADATA_FACTORY
type SchemaObjectForMetadataFactory = Omit<SchemaObject, 'required'> & {
  required: boolean | string[];
};

export const createZodDto = <T extends OpenApiZodAny>(
  zodSchema: T
): ZodDtoStatic<T> => {
  class SchemaHolderClass {
    public static zodSchema = zodSchema;
    schema: SchemaObject | undefined;

    constructor() {
      this.schema = generateSchema(zodSchema);
    }

    /** Found from METADATA_FACTORY_NAME
     * in Nestjs swagger module.
     * https://github.com/nestjs/swagger/blob/491b168cbff3003191e55ee96e77e69d8c1deb66/lib/type-helpers/mapped-types.utils.ts
     * METADATA_FACTORY_NAME is defined here as '_OPENAPI_METADATA_FACTORY' here:
     * https://github.com/nestjs/swagger/blob/491b168cbff3003191e55ee96e77e69d8c1deb66/lib/plugin/plugin-constants.ts
     */
    public static _OPENAPI_METADATA_FACTORY():
      | Record<string, SchemaObject | ReferenceObject>
      | undefined {
      const generatedSchema = generateSchema(zodSchema);

      const objIsReferenceObject = (
        obj: SchemaObject | SchemaObjectForMetadataFactory | ReferenceObject
      ): obj is ReferenceObject => (obj as ReferenceObject).$ref !== undefined;

      const appendRequiredProperties = (
        obj: SchemaObject | ReferenceObject
      ): SchemaObjectForMetadataFactory | ReferenceObject => {
        if (objIsReferenceObject(obj)) return obj;

        if (!obj.properties) return obj as SchemaObjectForMetadataFactory;

        const propertyKeyValues = Object.entries(obj.properties).map(
          ([key, property]) => {
            /** For some reason the SchemaObject model has everything except for the
             * required field, which is an array.
             * The NestJS swagger module requires this to be a boolean representative
             * of each property.
             * This logic takes the SchemaObject, and turns the required field from an
             * array to a boolean.
             */
            const schemaObjectWithRequiredField: SchemaObjectForMetadataFactory = {
              ...appendRequiredProperties(property),
              required:
                obj.required !== undefined && obj.required?.includes(key),
            };

            return [key, schemaObjectWithRequiredField];
          }
        );

        return {
          ...obj,
          properties: Object.fromEntries(propertyKeyValues),
        } as SchemaObjectForMetadataFactory;
      };

      const objectWithRequired = appendRequiredProperties(generatedSchema);

      return objIsReferenceObject(objectWithRequired) ? undefined : objectWithRequired.properties;
    }

    public static create(input: unknown): CompatibleZodInfer<T> {
      return this.zodSchema.parse(input);
    }
  }

  return <MergeZodSchemaOutput<T>>SchemaHolderClass;
};
