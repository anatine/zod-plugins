// CONSTANTS
import {
  TYPE_BOOLEAN,
  TYPE_INPUT,
  TYPE_LIST,
  TYPE_NAMED,
  TYPE_NONULL,
  TYPE_NUMBERS,
  TYPE_STRINGS,
} from '../types/graphqlTypes';

export const isArray = (kind: string) => kind === TYPE_LIST;
export const isRequired = (kind: string) => kind === TYPE_NONULL;
export const isType = (kind: string) => kind === TYPE_NAMED;

export const isRef = (kind: string) => kind.includes(TYPE_INPUT);
export const isBoolean = (kind: string) => kind === TYPE_BOOLEAN;
export const isString = (kind: string) => TYPE_STRINGS.includes(kind);
export const isNumber = (kind: string) => TYPE_NUMBERS.includes(kind);
