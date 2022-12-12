import * as z from 'zod';
import { ZodError } from 'zod';

import { createZodDto } from './create-zod-dto';

describe('zod-nesjs create-zod-dto', () => {
  const testDtoSchema = z.object({
    val: z.string(),
  });

  it('should create a DTO', () => {
    class TestDto extends createZodDto(testDtoSchema) {}
    const result = TestDto.create({ val: 'test' });
    expect(result).toEqual({ val: 'test' });
  });

  it('should throw if input does not match schema', () => {
    class TestDto extends createZodDto(testDtoSchema) {}
    expect(() => TestDto.create({ val: 123 })).toThrow(ZodError);
  });

  it('should allow using the zodSchema field to construct other types', () => {
    class TestDto extends createZodDto(testDtoSchema) {}
    expect(
      TestDto.zodSchema.extend({ extraField: z.string() }).parse({
        val: 'test',
        extraField: 'extra',
        unrecognizedField: 'unrecognized',
      })
    ).toEqual({ val: 'test', extraField: 'extra' });
  });

  it('should merge a discriminated union types for class', () => {
    enum Kind { A, B };
    const discriminatedSchema = z
      .discriminatedUnion('kind', [
        z.object({
          kind: z.literal(Kind.A),
          value: z.number()
        }),
        z.object({
          kind: z.literal(Kind.B),
          value: z.string()
        })
      ]);

    class TestDto extends createZodDto(discriminatedSchema) {}

    const result = TestDto.create({kind: Kind.A, value: 1})
    expect(result).toEqual({ kind: Kind.A, value: 1 });
  });

  it('should merge the union types for class', () => {
    enum Kind { A, B };
    const unionSchema = z
      .union([
        z.object({
          kind: z.literal(Kind.A),
          value: z.number()
        }),
        z.object({
          kind: z.literal(Kind.B),
          value: z.string()
        })
      ]);

    class TestDto extends createZodDto(unionSchema) {}

    const result = TestDto.create({kind: Kind.B, value: 'val'})
    expect(result).toEqual({ kind: Kind.B, value: 'val' });
  });
});
