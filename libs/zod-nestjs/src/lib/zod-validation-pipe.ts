/**
 * This file was originally taken directly from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/ZodValidationPipe.ts
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  HttpStatus,
  Optional,
} from '@nestjs/common';

import { ZodDtoStatic } from './create-zod-dto';
import { HTTP_ERRORS_BY_CODE } from './http-errors';

export interface ZodValidationPipeOptions {
  errorHttpStatusCode?: keyof typeof HTTP_ERRORS_BY_CODE;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly errorHttpStatusCode: keyof typeof HTTP_ERRORS_BY_CODE;

  constructor(@Optional() options?: ZodValidationPipeOptions) {
    this.errorHttpStatusCode =
      options?.errorHttpStatusCode || HttpStatus.BAD_REQUEST;
  }

  public transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const zodSchema = (metadata?.metatype as ZodDtoStatic)?.zodSchema;

    if (zodSchema) {
      const parseResult = zodSchema.safeParse(value);

      if (!parseResult.success) {
        const { error } = parseResult;
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
