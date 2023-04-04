import {
  ListTypeNode,
  NonNullTypeNode,
  NamedTypeNode,
  TypeNode,
} from 'graphql';

export const isListType = (typ?: TypeNode): typ is ListTypeNode =>
  typ?.kind === 'ListType';
export const isNonNullType = (typ?: TypeNode): typ is NonNullTypeNode =>
  typ?.kind === 'NonNullType';
export const isNamedType = (typ?: TypeNode): typ is NamedTypeNode =>
  typ?.kind === 'NamedType';

export const isInput = (kind: string) => kind.includes('Input');
