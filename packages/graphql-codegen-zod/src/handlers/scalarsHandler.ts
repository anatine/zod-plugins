import { IConfig, IScalars, ITypes } from '../types';

const scalarsHandler = (scalars: IScalars, types: ITypes, config: IConfig): string => {
  return Object.keys(scalars)
    .map((key) => {
      let schemaName = `export const ${key}Schema`;

      if (types[key]) {
        schemaName += `: z.ZodSchema<${types[key]}>`;
        // } else if (config.importOperationTypesFrom) {
        //   schemaName += `: z.ZodSchema<Types.Scalars["${key}"]>`;
        // } else {
        //   schemaName += `: z.ZodSchema<Scalars["${key}"]>`;
      }

      return `${schemaName} = ${scalars[key]};`;
    })
    .join('\n');
};

export default scalarsHandler;
