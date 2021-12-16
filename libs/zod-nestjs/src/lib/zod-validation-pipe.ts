/**
 * This file was originally taken directly from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/ZodValidationPipe.ts
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ZodDtoStatic } from './create-zod-dto';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  public transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const zodSchema = (metadata?.metatype as ZodDtoStatic<unknown>)?.zodSchema;

    if (zodSchema) {
      const parseResult = zodSchema.safeParse(value);

      if (!parseResult.success) {
        const { error } = parseResult;
        const message = error.errors.map(
          (error) => `${error.path.join('.')}: ${error.message}`
        );

        throw new UnprocessableEntityException(message);
      }

      return parseResult.data;
    }

    return value;
  }
}
