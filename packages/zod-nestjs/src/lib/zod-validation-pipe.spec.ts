import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationException } from './exception';
import {
  ZodValidationPipe,
  ZodValidationPipeOptions,
} from './zod-validation-pipe';

class DummyDto {
  static zodSchema = z.object({ num: z.number().int() });
}

describe('ZodValidationPipe', () => {
  const metadata = { metatype: DummyDto, type: 'body' } as any;

  it('should pass valid data through', () => {
    const pipe = new ZodValidationPipe();
    const input = { num: 5 };
    expect(pipe.transform(input, metadata)).toEqual(input);
  });

  it('should throw ZodValidationException by default on invalid data', () => {
    const pipe = new ZodValidationPipe();
    const input = { num: 'a' };
    expect(() => pipe.transform(input, metadata)).toThrow(
      ZodValidationException
    );
  });

  it('should throw custom exception when useZodValidationException=false', () => {
    const options: ZodValidationPipeOptions = {
      useZodValidationException: false,
      errorHttpStatusCode: 400,
    };
    const pipe = new ZodValidationPipe(options);
    try {
      pipe.transform({ num: 'a' }, metadata);
      throw new Error('Expected exception');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      // Should not be ZodValidationException
      expect(err).not.toBeInstanceOf(ZodValidationException);
      // message should be in array<string> format
      expect(Array.isArray((err as any).response?.message)).toBe(true);
    }
  });
});
