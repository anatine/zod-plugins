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
};

export const createZodDto = <T extends CompatibleZodType>(
  zodSchema: T
): ZodDtoStatic<T> => {
  class SchemaHolderClass {
    public static zodSchema = zodSchema;

    public static create(input: unknown): CompatibleZodInfer<T> {
      return this.zodSchema.parse(input);
    }
  }

  return SchemaHolderClass;
};
