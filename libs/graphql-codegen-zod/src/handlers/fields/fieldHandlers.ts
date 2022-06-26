import { InputValueDefinitionNode } from 'graphql';
import { IConfig } from '../../types';
import directiveHandler from '../directives/index';
import fieldKindHandler from './kindsHandler';

const fieldHandler = (field: InputValueDefinitionNode, config: IConfig) => {
  const fieldName = field.name.value;
  const fieldType = field.type;

  const { extraValidations } = directiveHandler(field.directives);
  let extra = '';

  for (const key in extraValidations) {
    if (Object.prototype.hasOwnProperty.call(extraValidations, key)) {
      const value = extraValidations[key];
      if (typeof value === 'string') {
        extra = `${extra}.${key}('${value}')`;
      } else {
        extra = `${extra}.${key}(${value})`;
      }
    }
  }
  return `${fieldName}: ${fieldKindHandler({
    fieldName,
    type: fieldType,
    extra,
    isOptional: true,
  })}`;
};

export default fieldHandler;
