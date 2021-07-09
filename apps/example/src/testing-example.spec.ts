import { z } from 'zod';
import * as short from 'short-uuid';
import { generateMock } from '@anatine/zod-mock';
import { generateSchema, openApi } from '@anatine/zod-openapi';

describe(`Creating Schema and Mocking`, () => {
  const translator = short();

  it.only('shoud deliver a great user scheam', () => {
    // const UserZ = openApi(
    //   z.object({
    //     uid: z.string().uuid().nonempty(),
    //     firstName: z.string().nonempty(),
    //     lastName: z.string().nonempty(),
    //     email: z.string().email(),
    //     avatar: z.string().url().optional(),
    //     jobTitle: z.string().optional(),
    //   })
    // );

    const UserZ = openApi(
      z.object({
        uid: openApi(
          z
            .string()
            .uuid()
            .nonempty()
            .transform((uuid) => translator.fromUUID(uuid)),
          {
            title: `Unique ID`,
            description: `Input is UUID, output is shortUUID`,
          }
        ),
        anotherUUID: z.string().uuid().optional(),
        firstName: z.string().nonempty(),
        lastName: z.string().nonempty(),
        email: z.string().email(),
        avatar: z.string().url().optional(),
        companyName: z.string().optional(),
        jobTitle: z.string().optional(),
        address: z
          .object({
            streetAddress: z.string(),
            city: z.string(),
            state: z.string(),
            zipCode: z.string(),
          })
          .optional(),
        hireDate: z.date().transform((date) => date.toISOString()),
        randomString: z.string(),
      }),
      { description: 'User model for application' }
    );

    const schema = generateSchema(UserZ); //?
    const mock = generateMock(UserZ); //?

    expect(schema).toBeDefined();
    expect(mock).toBeDefined();
  });
});
