import * as z from 'zod';
import { ZodError } from 'zod';

import { createZodDto } from './create-zod-dto';
import { SchemaObject as SchemaObject30 } from 'openapi3-ts/oas30';
import { OpenApiZodAny } from '@anatine/zod-openapi';

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
    enum Kind {
      A,
      B,
    }
    const discriminatedSchema = z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal(Kind.A),
        value: z.number(),
      }),
      z.object({
        kind: z.literal(Kind.B),
        value: z.string(),
      }),
    ]);

    class TestDto extends createZodDto(discriminatedSchema) {}

    const result = TestDto.create({ kind: Kind.A, value: 1 });
    expect(result).toEqual({ kind: Kind.A, value: 1 });
  });

  it('should merge the union types for class', () => {
    enum Kind {
      A,
      B,
    }
    const unionSchema = z.union([
      z.object({
        kind: z.literal(Kind.A),
        value: z.number(),
      }),
      z.object({
        kind: z.literal(Kind.B),
        value: z.string(),
      }),
    ]);

    class TestDto extends createZodDto(unionSchema) {}

    const result = TestDto.create({ kind: Kind.B, value: 'val' });
    expect(result).toEqual({ kind: Kind.B, value: 'val' });
  });

  it('should output OpenAPI 3.0-style nullable types', () => {
    const schema = z.object({
      name: z.string().nullable(),
    });
    const metadataFactory = getMetadataFactory(schema);

    const generatedSchema = metadataFactory();

    expect(generatedSchema).toBeDefined();
    expect(generatedSchema?.name.type).toEqual('string');
    expect(generatedSchema?.name.nullable).toBe(true);
  });

  it('should output OpenAPI 3.0-style exclusive minimum and maximum types', () => {
    const schema = z.object({
      inclusive: z.number().min(1).max(10),
      exclusive: z.number().gt(1).lt(10),
      unlimited: z.number(),
    });
    const metadataFactory = getMetadataFactory(schema);

    const generatedSchema = metadataFactory();

    expect(generatedSchema).toBeDefined();
    expect(generatedSchema?.inclusive.minimum).toBe(1);
    expect(generatedSchema?.inclusive.exclusiveMinimum).toBeUndefined();
    expect(generatedSchema?.inclusive.maximum).toBe(10);
    expect(generatedSchema?.inclusive.exclusiveMaximum).toBeUndefined();
    expect(generatedSchema?.exclusive.minimum).toBe(1);
    expect(generatedSchema?.exclusive.exclusiveMinimum).toBe(true);
    expect(generatedSchema?.exclusive.maximum).toBe(10);
    expect(generatedSchema?.exclusive.exclusiveMaximum).toBe(true);
    expect(generatedSchema?.unlimited.minimum).toBeUndefined();
    expect(generatedSchema?.unlimited.exclusiveMinimum).toBeUndefined();
    expect(generatedSchema?.unlimited.maximum).toBeUndefined();
    expect(generatedSchema?.unlimited.exclusiveMaximum).toBeUndefined();
  });

  it('should convert to OpenAPI 3.0 in deep objects and arrays', () => {
    const schema = z.object({
      person: z.object({
        name: z.string().nullable(),
        tags: z.array(
          z.object({ id: z.string(), name: z.string().nullable() })
        ),
      }),
    });
    const metadataFactory = getMetadataFactory(schema);

    const generatedSchema = metadataFactory();
    const personName = generatedSchema?.person.properties?.name as SchemaObject30
    const tags = generatedSchema?.person.properties?.tags as SchemaObject30
    const tagsItems = tags.items as SchemaObject30
    const tagName = tagsItems.properties?.name as SchemaObject30

    expect(generatedSchema).toBeDefined();
    expect(personName.type).toEqual('string');
    expect(personName.nullable).toBe(true);
    expect(tagName.type).toBe('string');
    expect(tagName.nullable).toBe(true);
  });

  it('should convert literal null value to OpenAPI 3.0', () => {
    const schema = z.object({
      name: z.null(),
    });
    const metadataFactory = getMetadataFactory(schema);

    const generatedSchema = metadataFactory();

    expect(generatedSchema).toBeDefined();
    expect(generatedSchema?.name.type).toEqual('string');
    expect(generatedSchema?.name.nullable).toBe(true);
  });
});

function getMetadataFactory(zodRef: OpenApiZodAny) {
  const schemaHolderClass = createZodDto(zodRef) as unknown as {
    _OPENAPI_METADATA_FACTORY: () => Record<string, SchemaObject30> | undefined;
  };
  return schemaHolderClass._OPENAPI_METADATA_FACTORY;
}
