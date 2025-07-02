/**
 * This file was originally taken directly from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/ZodValidationPipe.ts
 */

import {
  ArgumentMetadata,
  HttpStatus,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { ZodDtoStatic } from './create-zod-dto';
import { ZodValidationException } from './exception';
import { HTTP_ERRORS_BY_CODE } from './http-errors';

export interface ZodValidationPipeOptions {
  errorHttpStatusCode?: keyof typeof HTTP_ERRORS_BY_CODE;
  useZodValidationException?: boolean;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly errorHttpStatusCode: keyof typeof HTTP_ERRORS_BY_CODE;
  private readonly useZodValidationException: boolean;

  constructor(@Optional() options?: ZodValidationPipeOptions) {
    this.errorHttpStatusCode =
      options?.errorHttpStatusCode || HttpStatus.BAD_REQUEST;
    this.useZodValidationException = options?.useZodValidationException ?? false;
  }

  public transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const zodSchema = (metadata?.metatype as ZodDtoStatic)?.zodSchema;

    if (zodSchema) {
      const parseResult = zodSchema.safeParse(value);

      if (!parseResult.success) {
        const { error } = parseResult;

        // Throw custom ZodValidationException if enabled
        if (this.useZodValidationException) {
          throw new ZodValidationException(error);
        }

        // Fallback: throw standard HTTP error for backward compatibility
        const message = error.errors.map(
          (error) => `${error.path.join('.')}: ${error.message}`
        );
        throw new HTTP_ERRORS_BY_CODE[this.errorHttpStatusCode](message);
      }

      return parseResult.data;
    }

    return value;
  }
}
