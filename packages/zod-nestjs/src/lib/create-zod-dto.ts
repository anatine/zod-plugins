import type { SchemaObject as SchemaObject30 } from 'openapi3-ts/oas30';
import type {
  ReferenceObject,
  SchemaObject as SchemaObject31,
} from 'openapi3-ts/oas31';
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
    ? Merge<
        object,
        TupleToUnion<{
          [X in keyof Options]: Options[X] extends z.ZodType
            ? Options[X]['_output']
            : Options[X];
        }>
      >
    : T extends z.ZodUnion<infer UnionTypes>
    ? UnionTypes extends z.ZodType[]
      ? Merge<
          object,
          TupleToUnion<{
            [X in keyof UnionTypes]: UnionTypes[X] extends z.ZodType
              ? UnionTypes[X]['_output']
              : UnionTypes[X];
          }>
        >
      : T['_output']
    : T['_output'];

export type ZodDtoStatic<T extends CompatibleZodType = CompatibleZodType> = {
  new (): MergeZodSchemaOutput<T>;
  zodSchema: T;
  create(input: unknown): CompatibleZodInfer<T>;
};

// Used for transforming the SchemaObject in _OPENAPI_METADATA_FACTORY
type SchemaObjectForMetadataFactory = Omit<SchemaObject30, 'required'> & {
  required: boolean | string[];
};

export const createZodDto = <T extends OpenApiZodAny>(
  zodSchema: T
): ZodDtoStatic<T> => {
  class SchemaHolderClass {
    public static zodSchema = zodSchema;
    schema: SchemaObject31 | undefined;

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
      | Record<string, SchemaObject30>
      | undefined {
      const generatedSchema = generateSchema(zodSchema);
      SchemaHolderClass.convertSchemaObject(generatedSchema);
      return generatedSchema.properties as Record<string, SchemaObject30>;
    }

    private static convertSchemaObject(
      schemaObject: SchemaObject31 | ReferenceObject,
      required?: boolean
    ): void {
      if ('$ref' in schemaObject) {
        return;
      }

      // Recursively convert all sub-schemas
      const subSchemaObjects = [
        ...(schemaObject.allOf ?? []),
        ...(schemaObject.oneOf ?? []),
        ...(schemaObject.anyOf ?? []),
        ...(schemaObject.not ? [schemaObject.not] : []),
        ...(schemaObject.items ? [schemaObject.items] : []),
        ...(typeof schemaObject.additionalProperties === 'object'
          ? [schemaObject.additionalProperties]
          : []),
        ...(schemaObject.prefixItems ?? []),
      ];
      for (const subSchemaObject of subSchemaObjects) {
        SchemaHolderClass.convertSchemaObject(subSchemaObject);
      }

      for (const [key, subSchemaObject] of Object.entries(
        schemaObject.properties ?? {}
      )) {
        SchemaHolderClass.convertSchemaObject(
          subSchemaObject,
          schemaObject.required?.includes(key) ?? false
        );
      }

      /** For some reason the SchemaObject model has everything except for the
       * required field, which is an array.
       * The NestJS swagger module requires this to be a boolean representative
       * of each property.
       * This logic takes the SchemaObject, and turns the required field from an
       * array to a boolean.
       */

      const convertedSchemaObject =
        schemaObject as SchemaObjectForMetadataFactory;

      if (required !== undefined) {
        convertedSchemaObject.required = required;
      }

      // @nestjs/swagger expects OpenAPI 3.0-style schema objects
      // Nullable
      if (Array.isArray(convertedSchemaObject.type)) {
        convertedSchemaObject.nullable =
          convertedSchemaObject.type.includes('null') || undefined;
        convertedSchemaObject.type =
          convertedSchemaObject.type.find((item) => item !== 'null') ||
          'string';
      } else if (convertedSchemaObject.type === 'null') {
        convertedSchemaObject.type = 'string'; // There ist no explicit null value in OpenAPI 3.0
        convertedSchemaObject.nullable = true;
      }
      // Exclusive minimum and maximum
      const { exclusiveMinimum, exclusiveMaximum } = schemaObject;
      if (exclusiveMinimum !== undefined) {
        convertedSchemaObject.minimum = exclusiveMinimum;
        convertedSchemaObject.exclusiveMinimum = true;
      }
      if (exclusiveMaximum !== undefined) {
        convertedSchemaObject.maximum = exclusiveMaximum;
        convertedSchemaObject.exclusiveMaximum = true;
      }
    }

    public static create(input: unknown): CompatibleZodInfer<T> {
      return this.zodSchema.parse(input);
    }
  }

  return <MergeZodSchemaOutput<T>>SchemaHolderClass;
};
