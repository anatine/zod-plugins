import { ZodSchemaVisitor } from './zod/index';
import { MyZodSchemaVisitor } from './myzod/index';
import { transformSchemaAST } from '@graphql-codegen/schema-ast';
import { YupSchemaVisitor } from './yup/index';
import { ValidationSchemaPluginConfig } from './config';
import { oldVisit, PluginFunction, Types } from '@graphql-codegen/plugin-helpers';
import { GraphQLSchema } from 'graphql';

export const plugin: PluginFunction<ValidationSchemaPluginConfig, Types.ComplexPluginOutput> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: ValidationSchemaPluginConfig
): Types.ComplexPluginOutput => {
  const { schema: _schema, ast } = transformSchemaAST(schema, config);
  const { buildImports, initialEmit, ...visitor } = schemaVisitor(_schema, config);

  const result = oldVisit(ast, {
    leave: visitor,
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const generated = result.definitions.filter(def => typeof def === 'string');

  return {
    prepend: buildImports(),
    content: [initialEmit(), ...generated].join('\n'),
  };
};

const schemaVisitor = (schema: GraphQLSchema, config: ValidationSchemaPluginConfig) => {
  if (config?.schema === 'zod') {
    return ZodSchemaVisitor(schema, config);
  } else if (config?.schema === 'myzod') {
    return MyZodSchemaVisitor(schema, config);
  }
  return YupSchemaVisitor(schema, config);
};
