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
  if (isRequired(type.kind)) {
    result = `${fieldKindHandler({
      // @ts-expect-error
      type: type.type,
      fieldName,
      extra,
      isOptional: false,
    })}`;
  }

  if (isArray(type.kind)) {
    result = `z.array(${fieldKindHandler({
      // @ts-expect-error
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
