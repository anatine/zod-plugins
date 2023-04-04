import { IConfig, IEnums, ITypes } from '../types';

const enumsHandler = (
  enums: IEnums,
  types: ITypes,
  config: IConfig
): string => {
  return Object.keys(enums)
    .map((key) => {
      let schemaName = `export const ${key}Schema`;

      if (types[key]) {
        schemaName += `: z.ZodSchema<${types[key]}>`;
        // } else if (config.importOperationTypesFrom) {
        //   schemaName += `: z.ZodSchema<${['`', '${Types.', key, '}`'].join('')}>`;
        // } else {
        //   schemaName += `: z.ZodSchema<${['`', '${', key, '}`'].join('')}>`;
      }

      return `${schemaName} = z.enum(${JSON.stringify(enums[key])});`;
    })
    .join('\n');
};

export default enumsHandler;
