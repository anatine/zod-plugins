import { NamedTypeNode, TypeNode } from 'graphql';
import { isNamed } from '../../types/index';
import { isArray, isRequired, isType } from '../../utils/typesCheckers';
import fieldNamedTypeHandler from './namedTypesHandlers';

const fieldKindHandler = ({
  fieldName,
  type,
  extra = '',
  isOptional = true,
}: {
  fieldName: string;
  type: NamedTypeNode | TypeNode;
  extra: string;
  isOptional: boolean;
}) => {
  let result = '';
  if (fieldName === 'arrayRequired') {
    console.log({ fieldName, type, extra, isOptional });
  }
  if (isRequired(type.kind) && 'type' in type) {
    result = `${fieldKindHandler({
      type: type.type,
      fieldName,
      extra,
      isOptional: false,
    })}`;
  }

  if (isArray(type.kind) && 'type' in type) {
    result = `z.array(${fieldKindHandler({
      type: type.type,
      fieldName,
      extra,
      isOptional: true,
    })})`;

    if (isOptional) {
      result = `${result}.nullish()`;
    }
  }

  if (isType(type.kind) && isNamed(type)) {
    result = fieldNamedTypeHandler(type.name.value);
    result = `${result}${extra}`;

    if (isOptional) {
      result = `${result}.nullish()`;
    }
  }

  return result;
};

export default fieldKindHandler;
