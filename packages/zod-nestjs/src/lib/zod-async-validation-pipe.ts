/**
 * Support async validation for zod-schemas
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { ZodDtoStatic } from './create-zod-dto';
import { ZodType } from 'zod';
import { HTTP_ERRORS_BY_CODE } from './http-errors';
import { ZodValidationPipeOptions } from './interfaces';

@Injectable()
export class ZodAsyncValidationPipe
  implements PipeTransform<unknown, Promise<unknown>>
{
  private readonly errorHttpStatusCode: keyof typeof HTTP_ERRORS_BY_CODE;

  constructor(@Optional() options?: ZodValidationPipeOptions) {
    this.errorHttpStatusCode =
      options?.errorHttpStatusCode || HttpStatus.BAD_REQUEST;
  }

  public async transform(
    value: unknown,
    metadata: ArgumentMetadata
  ): Promise<unknown> {
    const zodSchema = (metadata?.metatype as ZodDtoStatic)?.zodSchema as
      | ZodType
      | undefined;

    if (zodSchema) {
      const parseResult = await zodSchema.safeParseAsync(value);

      if (!parseResult.success) {
        const message = parseResult.error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        );

        throw new HTTP_ERRORS_BY_CODE[this.errorHttpStatusCode](message);
      }

      return parseResult.data;
    }

    return value;
  }
}
