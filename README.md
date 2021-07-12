

# @anatine/zod-plugins

This is a monorepo project utilizing the tooling [Nx](https://nx.dev).

## Packages within this repository:

- ### [@anatine/zod-openapi](./libs/zod-openapi/README.md)
  - Converts a Zod schema into an OpenAPI 3.0 `SchemaObject`
  - Leverages [openapi3-ts](https://www.npmjs.com/package/openapi3-ts) for typings and builders

- ### [@anatine/zod-mock](./libs/zod-mock/README.md)
  - Generates a mock objet for testing.
  - Fake data generated from the peer dependency [faker.js](https://www.npmjs.com/package/faker) 

- ### [@anatine/zod-nestjs](./libs/zod-nestjs/README.md)
  - Helper tooling to use Zod in [NestJS](https://nestjs.com/).
  - Patch for [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction) to use `@anatine/zod-openapi` to display schemas.


----

This project was generated using [Nx](https://nx.dev).

