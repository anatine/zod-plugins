
# @anatine/zod-plugins

Various modules to help leverage zod in all sort so places

## Packages within this repository

- ### [@anatine/zod-openapi](./packages/zod-openapi/README.md)

  - Converts a Zod schema into an OpenAPI 3.0 `SchemaObject`
  - Leverages [openapi3-ts](https://www.npmjs.com/package/openapi3-ts) for typings and builders

- ### [@anatine/zod-mock](./packages/zod-mock/README.md)

  - Generates a mock objet for testing.
  - Fake data generated from the peer dependency [faker.js](https://www.npmjs.com/package/faker)

- ### [@anatine/zod-nestjs](./packages/zod-nestjs/README.md)

  - Helper tooling to use Zod in [NestJS](https://nestjs.com/).
  - Patch for [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction) to use `@anatine/zod-openapi` to display schemas.

- ### [@anatine/graphql-zod-validation](./packages/graphql-zod-validation/README.md)

  - Used with [GraphQL code generator](https://github.com/dotansimha/graphql-code-generator) plugin to generate form validation schema from your GraphQL schema.

- ### [@anatine/graphql-codegen-zod](./packages/graphql-codegen-zod/README.md)

  - Used with [GraphQL code generator](https://github.com/dotansimha/graphql-code-generator) plugin to generate form validation schema from your GraphQL schema.
  - Alternative codebase to [@anatine/graphql-zod-validation](./packages/graphql-zod-validation/README.md)

----

This is a monorepo project utilizing the tooling [Nx](https://nx.dev).

//registry.npmjs.org/:_authToken=${NPM_TOKEN}
