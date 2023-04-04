import {
  isBoolean,
  isNumber,
  isRef,
  isString,
} from '../../utils/typesCheckers';

const fieldNamedTypeHandler = (type: string) => {
  let result = 'z.';

  if (isRef(type)) {
    result = type + 'Schema';
  } else if (isBoolean(type)) {
    result = result + 'boolean()';
  } else if (isString(type)) {
    result = result + 'string()';
  } else if (isNumber(type)) {
    result = result + 'number()';
  } else {
    // Assume it's a defined schema!
    result = type + 'Schema';
  }

  return result;
};

export default fieldNamedTypeHandler;
