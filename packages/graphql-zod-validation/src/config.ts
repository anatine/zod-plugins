import { TypeScriptPluginConfig } from '@graphql-codegen/typescript';

export type ValidationSchema = 'yup' | 'zod' | 'myzod';

export interface DirectiveConfig {
  [directive: string]: {
    [argument: string]: string | string[] | DirectiveObjectArguments;
  };
}

export interface DirectiveObjectArguments {
  [matched: string]: string | string[];
}

interface ScalarSchemas {
  [name: string]: string;
}

export interface ValidationSchemaPluginConfig extends TypeScriptPluginConfig {
  /**
   * @description specify generate schema
   * @default yup
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - typescript
   *       - graphql-codegen-validation-schema
   *     config:
   *       schema: yup
   * ```
   */
  schema?: ValidationSchema;
  /**
   * @description import types from generated typescript type path
   * if not given, omit import statement.
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/types.ts:
   *     plugins:
   *       - typescript
   *   path/to/schemas.ts:
   *     plugins:
   *       - graphql-codegen-validation-schema
   *     config:
   *       schema: yup
   *       importFrom: ./path/to/types
   * ```
   */
  importFrom?: string;
  /**
   * @description Prefixes all import types from generated typescript type.
   * @default ""
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/types.ts:
   *     plugins:
   *       - typescript
   *   path/to/schemas.ts:
   *     plugins:
   *       - graphql-codegen-validation-schema
   *     config:
   *       typesPrefix: I
   *       importFrom: ./path/to/types
   * ```
   */
  typesPrefix?: string;
  /**
   * @description Suffixes all import types from generated typescript type.
   * @default ""
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/types.ts:
   *     plugins:
   *       - typescript
   *   path/to/schemas.ts:
   *     plugins:
   *       - graphql-codegen-validation-schema
   *     config:
   *       typesSuffix: I
   *       importFrom: ./path/to/types
   * ```
   */
  typesSuffix?: string;
  /**
   * @description Generates validation schema for enum as TypeScript `type`
   * @default false
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - graphql-codegen-validation-schema
   *     config:
   *       enumsAsTypes: true
   * ```
   *
   * ```yml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - typescript
   *       - graphql-codegen-validation-schema
   *     config:
   *       enumsAsTypes: true
   * ```
   */
  enumsAsTypes?: boolean;
  /**
   * @description Generates validation string schema as do not allow empty characters by default.
   * @default false
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - graphql-codegen-validation-schema
   *     config:
   *       notAllowEmptyString: true
   * ```
   */
  notAllowEmptyString?: boolean;
  /**
   * @description Extends or overrides validation schema for the built-in scalars and custom GraphQL scalars.
   *
   * @exampleMarkdown
   * ```yml
   * config:
   *   schema: yup
   *   scalarSchemas:
   *     Date: yup.date()
   *     Email: yup.string().email()
   * ```
   *
   * @exampleMarkdown
   * ```yml
   * config:
   *   schema: zod
   *   scalarSchemas:
   *     Date: z.date()
   *     Email: z.string().email()
   * ```
   */
  scalarSchemas?: ScalarSchemas;
  /**
   * @description Generates validation schema with more API based on directive schema.
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - graphql-codegen-validation-schema
   *     config:
   *       schema: yup
   *       directives:
   *         required:
   *           msg: required
   *         # This is example using constraint directive.
   *         # see: https://github.com/confuser/graphql-constraint-directive
   *         constraint:
   *           minLength: min # same as ['min', '$1']
   *           maxLength: max
   *           startsWith: ["matches", "/^$1/"]
   *           endsWith: ["matches", "/$1$/"]
   *           contains: ["matches", "/$1/"]
   *           notContains: ["matches", "/^((?!$1).)*$/"]
   *           pattern: ["matches", "/$1/"]
   *           format:
   *             # For example, `@constraint(format: "uri")`. this case $1 will be "uri".
   *             # Therefore the generator generates yup schema `.url()` followed by `uri: 'url'`
   *             # If $1 does not match anywhere, the generator will ignore.
   *             uri: url
   *             email: email
   *             uuid: uuid
   *             # yup does not have `ipv4` API. If you want to add this,
   *             # you need to add the logic using `yup.addMethod`.
   *             # see: https://github.com/jquense/yup#addmethodschematype-schema-name-string-method--schema-void
   *             ipv4: ipv4
   *           min: ["min", "$1 - 1"]
   *           max: ["max", "$1 + 1"]
   *           exclusiveMin: min
   *           exclusiveMax: max
   * ```
   */
  directives?: DirectiveConfig;
  /**
   * @description Converts the regular graphql type into a zod validation function.
   *
   * @exampleMarkdown
   * ```yml
   * generates:
   *   path/to/types.ts:
   *     plugins:
   *       - typescript
   *   path/to/schemas.ts:
   *     plugins:
   *       - graphql-codegen-validation-schema
   *     config:
   *       schema: yup
   *       useObjectTypes: true
   * ```
   */
  useObjectTypes?: boolean;
}
