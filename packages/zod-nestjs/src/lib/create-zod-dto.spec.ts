import * as z from 'zod';
import { ZodError } from 'zod';

import { createZodDto } from './create-zod-dto';

const testDtoSchema = z.object({
  val: z.string(),
});

class TestDto extends createZodDto(testDtoSchema) {}

enum TestEnum {
  North = 1,
  South = 2,
}

const TestDtoForOpenApiMetadataSchema = z.object({
  stringValue: z.string().email(),
  numberValue: z.number().max(5).min(2),
  booleanValue: z.boolean().optional(),
  enumValue: z.nativeEnum(TestEnum),
  preprocessedValue: z.preprocess((arg) => {
    const stringArg = z.string().parse(arg ?? '')
    return parseFloat(stringArg);
  }, z.number()),
})

class TestDtoForOpenApiMetadata extends createZodDto(TestDtoForOpenApiMetadataSchema) {}

describe('static create()', () => {
  it('should create the DTO', () => {
    const result = TestDto.create({ val: 'test' });

    expect(result).toEqual({ val: 'test' });
  });

  it('should throw if input does not match schema', () => {
    expect(() => TestDto.create({ val: 123 })).toThrow(ZodError);
  });
});

describe('static zodSchema', () => {
  it('should allow using the zodSchema field to construct other types', () => {
    expect(
      TestDto.zodSchema.extend({ extraField: z.string() }).parse({
        val: 'test',
        extraField: 'extra',
        unrecognizedField: 'unrecognized',
      })
    ).toEqual({ val: 'test', extraField: 'extra' });
  });
});

describe('static OPEN_API_METADATA', () => {
  it('should properly return a record of fields in the schema', () => {
    const records = TestDtoForOpenApiMetadata._OPENAPI_METADATA_FACTORY()
    console.log(TestDtoForOpenApiMetadata.zodSchema);
    expect(records).toEqual({
      stringValue: {
        type: 'string',
        required: true,
        format: 'email',
      },
      numberValue: {
        type: 'number',
        required: true,
        maximum: 5,
        minimum: 2,
      },
      booleanValue: {
        type: 'boolean',
        required: false,
      },
      enumValue: {
        type: 'string',
        required: true,
        enum: ['North', 'South', 1, 2],
      },
      preprocessedValue: {
        type: 'number',
        required: true,
      }
    })
  })
})