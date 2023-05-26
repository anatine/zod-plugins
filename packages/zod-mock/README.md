# @anatine/zod-mock

Generates a mock data object using [faker.js](https://www.npmjs.com/package/@faker-js/faker) from a [Zod](https://github.com/colinhacks/zod) schema.

----

## Installation

`@faker-js/faker` is a peer dependency of `@anatine/zod-mock` and is used for mock data generation.

```shell
npm install zod @faker-js/faker @anatine/zod-mock
```

----

## Usage

### Take any Zod schema and create mock data

```typescript
import { generateMock } from '@anatine/zod-mock';
const schema = z.object({
      uid: z.string().nonempty(),
      theme: z.enum([`light`, `dark`]),
      email: z.string().email().optional(),
      phoneNumber: z.string().min(10).optional(),
      avatar: z.string().url().optional(),
      jobTitle: z.string().optional(),
      otherUserEmails: z.array(z.string().email()),
      stringArrays: z.array(z.string()),
      stringLength: z.string().transform((val) => val.length),
      numberCount: z.number().transform((item) => `total value = ${item}`),
      age: z.number().min(18).max(120),
    });
const mockData = generateMock(schema);
// ...
```

This will generate mock data similar to:

```json
{
  "uid": "3f46b40e-95ed-43d0-9165-0b8730de8d14",
  "theme": "light",
  "email": "Alexandre99@hotmail.com",
  "phoneNumber": "1-665-405-2226",
  "avatar": "https://cdn.fakercloud.com/avatars/olaolusoga_128.jpg",
  "jobTitle": "Lead Brand Facilitator",
  "otherUserEmails": [
    "Wyman58@example.net",
    "Ignacio_Nader@example.org",
    "Jorge_Bradtke@example.org",
    "Elena.Torphy33@example.org",
    "Kelli_Bartoletti@example.com"
  ],
  "stringArrays": [
    "quisquam",
    "corrupti",
    "atque",
    "sunt",
    "voluptatem"
  ],
  "stringLength": 4,
  "numberCount": "total value = 25430",
  "age": 110
}
```

----

## Overriding string mocks

Sometimes there might be a reason to have a more specific mock for a string value.

You can supply an options field to generate specific mock data that will be triggered by the matching key.

```typescript
const schema = z.object({
  locked: z.string(),
  email: z.string().email(),
  primaryColor: z.string(),
});
const mockData = generateMock(schema, {
  stringMap: {
    locked: () => `this return set to the locked value`,
    email: () => `not a email anymore`,
    primaryColor: () => faker.internet.color(),
  },
});
```

----

## Adding a seed generator

For consistent testing, you can also add in a seed or seed array.

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
});
const seed = 123;
const first = generateMock(schema, { seed });
const second = generateMock(schema, { seed });
expect(first).toEqual(second);
```

----

## Adding a custom mock mapper

Once drilled down to deliver a string, number, boolean, or other primitive value a function with a matching name is searched for in faker.

You can add your own key/fn mapper in the options.

```typescript

export function mockeryMapper(
  keyName: string,
  fakerInstance: Faker
): FakerFunction | undefined {
  const keyToFnMap: Record<string, FakerFunction> = {
    image: fakerInstance.image.url,
    imageurl: fakerInstance.image.url,
    number: fakerInstance.number.int,
    float: fakerInstance.number.float,
    hexadecimal: fakerInstance.number.hex,
    uuid: fakerInstance.string.uuid,
    boolean: fakerInstance.datatype.boolean,
    // Email more guaranteed to be random for testing
    email: () => fakerInstance.database.mongodbObjectId() + '@example.com'
  };
  return keyName && keyName.toLowerCase() in keyToFnMap
    ? keyToFnMap[keyName.toLowerCase() as never]
    : undefined;
}

const schema = z.object({
  locked: z.string(),
  email: z.string().email(),
  primaryColor: z.string(),
});

const result = generateMock(schema, { mockeryMapper });

```

----

## Behind the Scenes

**`zod-mock`** tries to generate mock data from two sources.

- ### Object key name ie(`{ firstName: z.string() }`)

  This will check the string name of the key against all the available `faker` function names.
  Upon a match, it uses that function to generate a mock value.

- ### Zodtype ie(`const something =  z.string()`)

  In the case there is no key name (the schema doesn't contain an object) or there is no key name match,
  `zod-mock` will use the primitive type provided by `zod`.

  Some zod filter types (email, uuid, url, min, max, length) will also modify the results.

  If **`zod-mock`** does not yet support a Zod type used in your schema, you may provide a backup mock function to use for that particular type.

  ``` typescript
  const schema = z.object({
    anyVal: z.any()
  });
  const mockData = generateMock(schema, {
    backupMocks: {
      ZodAny: () => 'a value'
    }
  });
  ```

----

## Missing Features

- No pattern for passing options into `faker`, such as setting phone number formatting
- Does not handle the following Zod types:
  - ZodAny
  - ZodDefault
  - ZodFunction
  - ZodIntersection
  - ZodMap
  - ZodPromise
  - ZodSet
  - ZodTuple
  - ZodUnion
  - ZodUnknown

----

## Credits

- ### [express-zod-api](https://github.com/RobinTail/express-zod-api)

  A great lib that provided some insights on dealing with various zod types.

----

This library is part of a nx monorepo [@anatine/zod-plugins](https://github.com/anatine/zod-plugins).
