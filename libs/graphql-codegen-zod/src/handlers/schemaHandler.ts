/* eslint-disable no-console */
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { GraphQLSchema, parse, visit } from 'graphql';
import { inspect } from 'util';
import { IConfig, IEnums, INodes, IScalars, ITypes } from '../types/index';
import { DIRECTIVE_NAME } from '../utils/constants';

const schemaHandler = (schema: GraphQLSchema, config: IConfig) => {
  const printedSchema = printSchemaWithDirectives(schema);

  const astNode = parse(printedSchema);

  const nodes: INodes[] = [];
  const enums: IEnums = {};
  const scalars: IScalars = {};
  const types: ITypes = {};

  visit(astNode, {
    InputObjectTypeDefinition: {
      leave: (node) => {
        // console.log(
        //   inspect({ source: 'InputObjectTypeDefinition', node }, false, 5, true)
        // );
        let hasValidation = Boolean(!config.onlyWithValidation);
        if (!hasValidation) {
          node.fields?.forEach((field) => {
            const validation = field.directives?.find(
              (directive) => directive.name.value === DIRECTIVE_NAME
            );
            if (validation) {
              hasValidation = true;
            }
          });
        }
        if (hasValidation)
          nodes.push({
            name: node.name.value,
            fields: [...(node.fields || [])],
          });

        if (config.zodTypesMap[node.name.value]) {
          types[node.name.value] = config.zodTypesMap[node.name.value];
        }
      },
    },
    ObjectTypeDefinition: {
      leave: (node) => {
        // console.log(
        //   inspect({ source: 'ObjectTypeDefinition', node }, false, 5, true)
        // );
        let hasValidation = Boolean(!config.onlyWithValidation);
        if (!hasValidation) {
          node.fields?.forEach((field) => {
            const validation = field.directives?.find(
              (directive) => directive.name.value === DIRECTIVE_NAME
            );
            if (validation) {
              hasValidation = true;
            }
          });
        }
        if (hasValidation) {
          console.log(`Pushing ${node.name.value}`);
          nodes.push({
            name: node.name.value,
            fields: [...(node.fields || [])],
          });
        }

        console.log(`types: ${node.name.value}`);
        if (config.zodTypesMap[node.name.value]) {
          types[node.name.value] = config.zodTypesMap[node.name.value];
        }
      },
    },
    EnumTypeDefinition: {
      leave: (node) => {
        if (node.values) {
          enums[node.name.value] = node.values?.map((e) => e.name.value);
        }
      },
    },
    ScalarTypeDefinition: {
      leave: (node) => {
        if (config.zodSchemasMap[node.name.value]) {
          scalars[node.name.value] = config.zodSchemasMap[node.name.value];
        } else {
          throw new Error(
            `${node.name.value} is not a defined scalar. Please define it in the codegen.yml file`
          );
        }

        if (config.zodTypesMap[node.name.value]) {
          types[node.name.value] = config.zodTypesMap[node.name.value];
        }
      },
    },
  });

  return {
    hasValidation: !config.onlyWithValidation,
    nodes,
    enums,
    scalars,
    types,
  };
};

export default schemaHandler;
