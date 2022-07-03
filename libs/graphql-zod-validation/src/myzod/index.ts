import { isInput, isNonNullType, isListType, isNamedType } from './../graphql';
import { ValidationSchemaPluginConfig } from '../config';
import {
  InputValueDefinitionNode,
  NameNode,
  TypeNode,
  GraphQLSchema,
  InputObjectTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
} from 'graphql';
import {
  DeclarationBlock,
  indent,
} from '@graphql-codegen/visitor-plugin-common';
import { TsVisitor } from '@graphql-codegen/typescript';
import { buildApi, formatDirectiveConfig } from '../directive';

const importZod = `import * as myzod from 'myzod'`;
const anySchema = `definedNonNullAnySchema`;

export const MyZodSchemaVisitor = (
  schema: GraphQLSchema,
  config: ValidationSchemaPluginConfig
) => {
  const tsVisitor = new TsVisitor(schema, config);

  const importTypes: string[] = [];

  return {
    buildImports: (): string[] => {
      if (config.importFrom && importTypes.length > 0) {
        return [
          importZod,
          `import { ${importTypes.join(', ')} } from '${config.importFrom}'`,
        ];
      }
      return [importZod];
    },
    initialEmit: (): string =>
      '\n' +
      [
        new DeclarationBlock({})
          .export()
          .asKind('const')
          .withName(`${anySchema}`)
          .withContent(`myzod.object({})`).string,
      ].join('\n'),
    InputObjectTypeDefinition: (node: InputObjectTypeDefinitionNode) => {
      const name = tsVisitor.convertName(node.name.value);
      importTypes.push(name);

      const shape = node.fields
        ?.map((field) =>
          generateFieldMyZodSchema(config, tsVisitor, schema, field, 2)
        )
        .join(',\n');

      return new DeclarationBlock({})
        .export()
        .asKind('function')
        .withName(`${name}Schema(): myzod.Type<${name}>`)
        .withBlock(
          [indent(`return myzod.object({`), shape, indent('})')].join('\n')
        ).string;
    },
    ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
      if (!config.useObjectTypes) return;
      const name = tsVisitor.convertName(node.name.value);
      importTypes.push(name);

      const shape = node.fields
        ?.map((field) =>
          generateFieldMyZodSchema(config, tsVisitor, schema, field, 2)
        )
        .join(',\n');

      return new DeclarationBlock({})
        .export()
        .asKind('function')
        .withName(`${name}Schema(): myzod.Type<${name}>`)
        .withBlock(
          [
            indent(`return myzod.object({`),
            `    __typename: myzod.literal('${node.name.value}').optional(),\n${shape}`,
            indent('})'),
          ].join('\n')
        ).string;
    },
    EnumTypeDefinition: (node: EnumTypeDefinitionNode) => {
      const enumname = tsVisitor.convertName(node.name.value);
      importTypes.push(enumname);
      // z.enum are basically myzod.literals
      if (config.enumsAsTypes) {
        return new DeclarationBlock({})
          .export()
          .asKind('type')
          .withName(`${enumname}Schema`)
          .withContent(
            `myzod.literals(${node.values
              ?.map((enumOption) => `'${enumOption.name.value}'`)
              .join(', ')})`
          ).string;
      }

      return new DeclarationBlock({})
        .export()
        .asKind('const')
        .withName(`${enumname}Schema`)
        .withContent(`myzod.enum(${enumname})`).string;
    },
  };
};

const generateFieldMyZodSchema = (
  config: ValidationSchemaPluginConfig,
  tsVisitor: TsVisitor,
  schema: GraphQLSchema,
  field: InputValueDefinitionNode | FieldDefinitionNode,
  indentCount: number
): string => {
  const gen = generateFieldTypeMyZodSchema(
    config,
    tsVisitor,
    schema,
    field,
    field.type
  );
  return indent(
    `${field.name.value}: ${maybeLazy(field.type, gen)}`,
    indentCount
  );
};

const generateFieldTypeMyZodSchema = (
  config: ValidationSchemaPluginConfig,
  tsVisitor: TsVisitor,
  schema: GraphQLSchema,
  field: InputValueDefinitionNode | FieldDefinitionNode,
  type: TypeNode,
  parentType?: TypeNode
): string => {
  if (isListType(type)) {
    const gen = generateFieldTypeMyZodSchema(
      config,
      tsVisitor,
      schema,
      field,
      type.type,
      type
    );
    if (!isNonNullType(parentType)) {
      const arrayGen = `myzod.array(${maybeLazy(type.type, gen)})`;
      const maybeLazyGen = applyDirectives(config, field, arrayGen);
      return `${maybeLazyGen}.optional().nullable()`;
    }
    return `myzod.array(${maybeLazy(type.type, gen)})`;
  }
  if (isNonNullType(type)) {
    const gen = generateFieldTypeMyZodSchema(
      config,
      tsVisitor,
      schema,
      field,
      type.type,
      type
    );
    return maybeLazy(type.type, gen);
  }
  if (isNamedType(type)) {
    const gen = generateNameNodeMyZodSchema(
      config,
      tsVisitor,
      schema,
      type.name
    );
    if (isListType(parentType)) {
      return `${gen}.nullable()`;
    }
    const appliedDirectivesGen = applyDirectives(config, field, gen);
    if (isNonNullType(parentType)) {
      if (config.notAllowEmptyString === true) {
        const tsType = tsVisitor.scalars[type.name.value];
        if (tsType === 'string') return `${gen}.min(1)`;
      }
      return appliedDirectivesGen;
    }
    if (isListType(parentType)) {
      return `${appliedDirectivesGen}.nullable()`;
    }
    return `${appliedDirectivesGen}.optional().nullable()`;
  }
  console.warn('unhandled type:', type);
  return '';
};

const applyDirectives = (
  config: ValidationSchemaPluginConfig,
  field: InputValueDefinitionNode | FieldDefinitionNode,
  gen: string
): string => {
  if (config.directives && field.directives) {
    const formatted = formatDirectiveConfig(config.directives);
    return gen + buildApi(formatted, field.directives);
  }
  return gen;
};

const generateNameNodeMyZodSchema = (
  config: ValidationSchemaPluginConfig,
  tsVisitor: TsVisitor,
  schema: GraphQLSchema,
  node: NameNode
): string => {
  const typ = schema.getType(node.value);

  if (typ && typ.astNode?.kind === 'InputObjectTypeDefinition') {
    const enumName = tsVisitor.convertName(typ.astNode.name.value);
    return `${enumName}Schema()`;
  }

  if (typ && typ.astNode?.kind === 'EnumTypeDefinition') {
    const enumName = tsVisitor.convertName(typ.astNode.name.value);
    return `${enumName}Schema`;
  }

  return myzod4Scalar(config, tsVisitor, node.value);
};

const maybeLazy = (type: TypeNode, schema: string): string => {
  if (isNamedType(type) && isInput(type.name.value)) {
    return `myzod.lazy(() => ${schema})`;
  }
  return schema;
};

const myzod4Scalar = (
  config: ValidationSchemaPluginConfig,
  tsVisitor: TsVisitor,
  scalarName: string
): string => {
  if (config.scalarSchemas?.[scalarName]) {
    return config.scalarSchemas[scalarName];
  }
  const tsType = tsVisitor.scalars[scalarName];
  switch (tsType) {
    case 'string':
      return `myzod.string()`;
    case 'number':
      return `myzod.number()`;
    case 'boolean':
      return `myzod.boolean()`;
  }
  console.warn('unhandled name:', scalarName);
  return anySchema;
};
