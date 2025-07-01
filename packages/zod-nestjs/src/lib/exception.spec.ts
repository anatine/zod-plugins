import { z } from 'zod';
import { ZodValidationException } from './exception';

describe('ZodValidationException', () => {
  const schema = z.object({ foo: z.string().min(3) });
  const invalidInput = { foo: 'ab' };

  it('should extend BadRequestException and include original ZodError', () => {
    const parseResult = schema.safeParse(invalidInput);
    if (parseResult.success) {
      throw new Error('Expected parseResult to be error');
    }
    const exception = new ZodValidationException(parseResult.error, 'Custom message');
    // instanceof check
    expect(exception).toBeInstanceOf(ZodValidationException);
    // Prefer custom message for exception.message
    expect(exception.message).toEqual('Custom message');
    // Should retain the original ZodError
    expect(exception.getZodError()).toBe(parseResult.error);
  });

  it('should format message when no custom message provided', () => {
    const parseResult = schema.safeParse(invalidInput);
    if (parseResult.success) {
      throw new Error('Expected parseResult to be error');
    }
    const exception = new ZodValidationException(parseResult.error);
    // Default message should include path and error message
    expect(exception.message).toContain('foo: String must contain at least 3 character');
  });

  it('getFormattedZodError should return Record<string, string>', () => {
    const parseResult = schema.safeParse(invalidInput);
    if (parseResult.success) {
      throw new Error('Expected parseResult to be error');
    }
    const exception = new ZodValidationException(parseResult.error);
    const formatted = exception.getFormattedZodError();
    expect(formatted).toHaveProperty('foo');
    expect(typeof formatted.foo).toBe('string');
  });
});
