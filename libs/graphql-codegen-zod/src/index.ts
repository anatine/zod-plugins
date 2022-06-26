import type { PluginFunction } from '@graphql-codegen/plugin-helpers/types';
import enumsHandler from './handlers/enumsHandler';
import nodesHandler from './handlers/nodesHandler';
import scalarsHandler from './handlers/scalarsHandler';
import schemaHandler from './handlers/schemaHandler';

export const plugin: PluginFunction = (schema, documents, config) => {
  // const results = schemaHandler(schema, config);

  // return `export const result = ${JSON.stringify(
  //   {
  //     results,
  //   },
  //   null,
  //   2
  // )}`;

  const { enums, nodes, scalars, types } = schemaHandler(schema, config);
  const parsedEnums = enumsHandler(enums, types, config);
  const parsedNodes = nodesHandler(nodes, config, types);
  const parsedScalars = scalarsHandler(scalars, types, config);

  return [
    `import { z } from 'zod';`,
    config.importOperationTypesFrom
      ? `import type * as Types from '${config.importOperationTypesFrom}'`
      : '',
    parsedScalars,
    parsedEnums,
    parsedNodes,
  ].join('\n\n');
};
