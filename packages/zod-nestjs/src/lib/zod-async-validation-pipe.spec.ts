import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodAsyncValidationPipe } from './zod-async-validation-pipe';

// Example schema using superRefine with async validation
const asyncSchema = z
  .object({ num: z.number().int() })
  .superRefine(async (data, ctx) => {
    // Simulate async validation, e.g., check if num is even after a delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (typeof data.num !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Number must be even (checked asynchronously)',
        path: ['num'],
        fatal: true,
      });
    }
  });

class MyAsyncDto {
  static zodSchema = asyncSchema;
}

describe('ZodAsyncValidationPipe', () => {
  const metadata = { metatype: MyAsyncDto, type: 'body' } as ArgumentMetadata;

  it('should pass valid data through', async () => {
    const pipe = new ZodAsyncValidationPipe();
    const input = { num: 10 };
    const transformed = await pipe.transform(input, metadata);
    expect(transformed).toEqual(input);
  });

  it('should throw BadRequestException for invalid data', async () => {
    const pipe = new ZodAsyncValidationPipe();
    const input = { num: 'invalid' };
    await expect(pipe.transform(input, metadata)).rejects.toThrow(
      BadRequestException
    );
  });

  it('should pass async validation for even numbers', async () => {
    const pipe = new ZodAsyncValidationPipe();
    const input = { num: 4 };
    await expect(pipe.transform(input, metadata)).resolves.toEqual(input);
  });
});
