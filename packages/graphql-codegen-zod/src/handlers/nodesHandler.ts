import { IConfig, INodes, ITypes } from '../types/index';
import fieldsHandler from './fields';

const nodesHandler = (nodes: INodes[], config: IConfig, types: ITypes) => {
  return nodes
    .map(({ name, fields }) => {
      const fieldsZod = fieldsHandler(fields, config);
      let schemaName = `export const ${name}Schema`;

      if (types[name]) {
        schemaName += `: z.ZodSchema<${types[name]}>`;
        // } else if (config.importOperationTypesFrom) {
        //   schemaName += `: z.ZodSchema<Types.${name}>`;
        // } else {
        //   schemaName += `: z.ZodSchema<${name}>`;
      }

      if (config.lazy) {
        return `${schemaName} = z.lazy(() => z.object({\n${fieldsZod}\n}))`;
      }

      return `${schemaName} = z.object({\n${fieldsZod}\n})`;
    })
    .join(';\n\n\n');
};

export default nodesHandler;
