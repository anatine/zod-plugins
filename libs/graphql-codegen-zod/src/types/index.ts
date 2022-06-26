// TYPES
import type {
  FieldDefinitionNode,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import { NamedTypeNode, TypeNode } from 'graphql';

export interface INodes {
  name: string;
  fields: InputValueDefinitionNode[];
}

export interface IEnums {
  [key: string]: string[];
}
export interface IScalars {
  [key: string]: string;
}

export interface ITypes {
  [key: string]: string;
}

export interface IHandled {
  nodes: INodes[];
  enums: IEnums;
}

export interface IConfig {
  defaultRequiredMessage?: string;
  onlyWithValidation?: boolean;
  zodSchemasMap: { [key: string]: string };
  zodTypesMap: { [key: string]: string };
  lazy?: boolean;
  importOperationTypesFrom?: string;
}

export const isNamed = (
  type: NamedTypeNode | TypeNode
): type is NamedTypeNode => {
  return (type as NamedTypeNode).name !== undefined;
};
