import { HTTP_ERRORS_BY_CODE } from './http-errors';

export interface ZodValidationPipeOptions {
  errorHttpStatusCode?: keyof typeof HTTP_ERRORS_BY_CODE;
}
