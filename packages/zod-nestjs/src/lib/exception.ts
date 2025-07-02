import { BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

/**
 * Custom exception for Zod validation errors.
 * This exception exposes the original ZodError instance for advanced error handling.
 */
export class ZodValidationException extends BadRequestException {
  public readonly zodError: ZodError;

  constructor(zodError: ZodError, message?: string) {
    // If no custom message, concatenate all Zod error messages.
    const formattedMessage =
      message ||
      zodError.errors
        .map((error) => `${error.path.join('.')}: ${error.message}`)
        .join(', ');
    super(formattedMessage);
    this.zodError = zodError;
  }

  /**
   * Returns the original ZodError object.
   */
  getZodError(): ZodError {
    return this.zodError;
  }

  /**
   * Returns a formatted object of Zod errors: { path: message }
   */
  getFormattedZodError(): Record<string, string> {
    return this.zodError.errors.reduce((acc, error) => {
      const path = error.path.join('.');
      acc[path] = error.message;
      return acc;
    }, {} as Record<string, string>);
  }
}
