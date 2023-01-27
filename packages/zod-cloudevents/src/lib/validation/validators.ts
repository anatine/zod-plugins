/*
Source code from https://github.com/cloudevents/sdk-javascript/blob/main/src/event/validation.ts
CloudEvents
*/
export type TypeArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

const globalThisPolyfill = (function () {
  try {
    return globalThis;
  } catch (e) {
    try {
      return self;
    } catch (e) {
      return global;
    }
  }
})();

export const isString = (v: unknown): boolean => typeof v === 'string';
export const isObject = (v: unknown): boolean => typeof v === 'object';
export const isDefined = (v: unknown): boolean =>
  v !== null && typeof v !== 'undefined';

export const isBoolean = (v: unknown): boolean => typeof v === 'boolean';
export const isInteger = (v: unknown): boolean => Number.isInteger(v as number);
export const isDate = (v: unknown): v is Date => v instanceof Date;
export const isBinary = (v: unknown): boolean => ArrayBuffer.isView(v);

export const isBase64 = (value: unknown): boolean =>
  Buffer.from(value as string, 'base64').toString('base64') === value;

export const isBuffer = (value: unknown): boolean => value instanceof Buffer;

export const asBuffer = (value: string | Buffer | TypeArray): Buffer => {
  if (isBinary(value)) {
    return Buffer.from(value as unknown as string);
  }
  if (isBuffer(value)) {
    return value as Buffer;
  }
  throw new TypeError('is not buffer or a valid binary');
};

export const base64AsBinary = (base64String: string): Uint8Array => {
  const toBinaryString = (base64Str: string): string =>
    globalThisPolyfill.atob
      ? globalThisPolyfill.atob(base64Str)
      : Buffer.from(base64Str, 'base64').toString('binary');

  return Uint8Array.from(toBinaryString(base64String), (c) => c.charCodeAt(0));
};

export const asBase64 = (value: string | Buffer | TypeArray): string =>
  asBuffer(value).toString('base64');

export const isJsonContentType = (contentType: string): boolean =>
  Boolean(contentType && contentType.match(/(json)/i));

export const asData = (data: unknown, contentType: string): string => {
  // pattern matching alike
  const maybeJson =
    isString(data) && !isBase64(data) && isJsonContentType(contentType)
      ? JSON.parse(data as string)
      : data;

  return isBinary(maybeJson) ? asBase64(maybeJson) : maybeJson;
};

export const isValidType = (
  v: boolean | number | string | Date | TypeArray | unknown
): boolean =>
  isBoolean(v) ||
  isInteger(v) ||
  isString(v) ||
  isDate(v) ||
  isBinary(v) ||
  isObject(v);
