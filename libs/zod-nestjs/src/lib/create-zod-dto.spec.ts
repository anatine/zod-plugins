import * as z from 'zod';
import { ZodError } from 'zod';

import { createZodDto } from './create-zod-dto';

const testDtoSchema = z.object({
  val: z.string(),
});

class TestDto extends createZodDto(testDtoSchema) {}

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
