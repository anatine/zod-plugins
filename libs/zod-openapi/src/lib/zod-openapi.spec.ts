import { inspect } from 'util';
import { z, ZodTypeAny } from 'zod';
import {
  OpenApiBuilder,
  OperationObject,
  SchemaObject,
  ReferenceObject,
} from 'openapi3-ts';

import { openApi, generateSchema } from './zod-openapi';

describe('zodOpenapi', () => {
  const description = `The description field of a schema`;

  const zodSchema = z.object({
    name: openApi(z.string(), { description: `User full name` }),
    email: openApi(z.string().email(), { description: 'User email' }),
  });

  // it('It should handle a string type', () => {
  //   const zodTest = openApi(z.string(), {
  //     description,
  //   });
  //   const schemaTest = generateSchema(zodTest);
  //   expect(schemaTest.description).toEqual(description);
  // });

  it('It should handle a object with string type', () => {
    const schemaTest = generateSchema(zodSchema);
    expect(
      schemaTest.properties &&
        'description' in schemaTest.properties?.name &&
        schemaTest.properties?.name.description
    ).toEqual('User full name'); // ! Bullshit. This should generate the typed object too

    const builder = OpenApiBuilder.create();
    builder.addSchema('Users', schemaTest);

    builder; //?

    console.log(schemaTest);
    // console.log(zodTest.shape);
    console.log(builder);
  });
});
