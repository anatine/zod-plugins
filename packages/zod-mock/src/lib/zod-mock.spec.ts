import { z } from 'zod';
import { generateMock, ZodMockError } from './zod-mock';
import { faker } from '@faker-js/faker';

describe('zod-mock', () => {
  it('should generate a mock object using faker', () => {
    enum NativeEnum {
      a = 1,
      b = 2,
    }

    const schema = z.object({
      uid: z.string().nonempty(),
      theme: z.enum([`light`, `dark`]),
      name: z.string(),
      firstName: z.string(),
      email: z.string().email().optional(),
      phoneNumber: z.string().min(10).optional(),
      avatar: z.string().url().optional(),
      jobTitle: z.string().optional(),
      otherUserEmails: z.array(z.string().email()),
      stringArrays: z.array(z.string()),
      stringLength: z.string().transform((val) => val.length),
      numberCount: z.number().transform((item) => `total value = ${item}`),
      age: z.number().min(18).max(120),
      record: z.record(z.string(), z.number()),
      nativeEnum: z.nativeEnum(NativeEnum),
      set: z.set(z.string()),
      map: z.map(z.string(), z.number()),
      discriminatedUnion: z.discriminatedUnion('discriminator', [
        z.object({ discriminator: z.literal('a'), a: z.boolean() }),
        z.object({ discriminator: z.literal('b'), b: z.string() }),
      ]),
    });

    const mockData = generateMock(schema);

    expect(typeof mockData.uid).toEqual('string');
    expect(
      mockData.theme === 'light' || mockData.theme === 'dark'
    ).toBeTruthy();
    expect(mockData.email).toEqual(expect.stringMatching(/\S+@\S+\.\S+/));
    expect(mockData.avatar).toEqual(
      expect.stringMatching(
        /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i
      )
    );
    expect(typeof mockData.phoneNumber).toEqual('string');
    expect(typeof mockData.jobTitle).toEqual('string');
    expect(typeof mockData.stringLength).toEqual('number');
    expect(typeof mockData.numberCount).toEqual('string');
    expect(mockData.age).toBeGreaterThanOrEqual(18);
    expect(mockData.age).toBeLessThanOrEqual(120);
    expect(typeof mockData.record).toEqual('object');
    expect(typeof Object.values(mockData.record)[0]).toEqual('number');
    expect(mockData.nativeEnum === 1 || mockData.nativeEnum === 2);
    expect(mockData.set).toBeTruthy();
    expect(mockData.map).toBeTruthy();
    expect(mockData.discriminatedUnion).toBeTruthy();
  });

  it('should generate mock data of the appropriate type when the field names overlap Faker properties that are not valid functions', () => {
    const schema = z.object({
      // the following fields represent non function properties in Faker
      lorem: z.string(),
      phone_number: z.string().min(10).optional(),

      // 'shuffle', located at `faker.helpers.shuffle`, is a function, but does not
      // produce the appropriate return type to match `fakerFunction`
      shuffle: z.string(),

      // 'seed', located at `faker.mersenne.seed` is a function but will throw an error
      // if it is called with the wrong parameter
      seed: z.string(),
    });

    const mockData = generateMock(schema);
    expect(typeof mockData.lorem).toEqual('string');
    expect(typeof mockData.phone_number).toEqual('string');
    expect(typeof mockData.shuffle).toEqual('string');
    expect(typeof mockData.seed).toEqual('string');
  });

  it('Should manually mock string key names to set values', () => {
    const schema = z.object({
      uid: z.string().nonempty(),
      theme: z.enum([`light`, `dark`]),
      locked: z.string(),
      email: z.string().email(),
      camelCase: z.string(),
    });

    const stringMap = {
      locked: () => `value set`,
      email: () => `not a email anymore`,
      camelCase: () => 'Exact case works',
    };

    const mockData = generateMock(schema, { stringMap });

    expect(mockData.uid).toEqual(
      expect.stringMatching(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      )
    );
    expect(mockData.theme).toEqual(expect.stringMatching(/light|dark/));
    expect(mockData.locked).toEqual('value set');
    expect(mockData.email).toEqual(
      expect.stringMatching('not a email anymore')
    );
    expect(mockData.camelCase).toEqual(stringMap.camelCase());

    return;
  });

  it('should convert values produced by Faker to string when the schema type is string.', () => {
    const schema = z.object({
      number: z.string(),
      boolean: z.string(),
      date: z.string(),
    });
    const mockData = generateMock(schema);
    expect(typeof mockData.number === 'string').toBeTruthy();
    expect(typeof mockData.boolean === 'string').toBeTruthy();
    expect(typeof mockData.date === 'string').toBeTruthy();
  });

  it("should support generating date strings via Faker for keys of 'date' and 'dateTime'.", () => {
    const schema = z.object({
      date: z.string(),
    });
    const mockData = generateMock(schema);
    expect(new Date(mockData.date).getTime()).not.toBeNaN();
  });

  describe('when handling min and max string lengths', () => {
    const createSchema = (min: number, max: number) =>
      z.object({
        default: z.string().min(min).max(max),
        email: z.string().min(min).max(max),
        uuid: z.string().min(min).max(max),
        url: z.string().min(min).max(max),
        name: z.string().min(min).max(max),
        color: z.string().min(min).max(max),
        notFound: z.string().min(min).max(max),
      });
    it('should create mock strings that respect the specified min and max lengths (inclusive)', () => {
      const min = 1;
      const max = 5;
      const mockData = generateMock(createSchema(min, max));

      Object.values(mockData).forEach((val) => {
        expect(val.length).toBeGreaterThanOrEqual(min);
        expect(val.length).toBeLessThanOrEqual(max);
      });
    });

    it('should respect the max length when the min is greater than the max', () => {
      const min = 5;
      const max = 2;
      const mockData = generateMock(createSchema(min, max));

      Object.values(mockData).forEach((val) => {
        expect(val.length).toBeLessThanOrEqual(max);
      });
    });

    it('should append extra string content to meet a minimum length', () => {
      const min = 100;
      const max = 100;
      const mockData = generateMock(createSchema(min, max));

      Object.values(mockData).forEach((val) => {
        expect(val.length).toBeGreaterThanOrEqual(min);
        expect(val.length).toBeLessThanOrEqual(max);
      });
    });
  });

  describe('when handling length property on string', () => {
    const createSchema = (len: number) =>
      z.object({
        default: z.string().length(len),
      });

    it('should create mock strings that respect the specified length', () => {
      const length = 33;
      const mockData = generateMock(createSchema(length));

      Object.values(mockData).forEach((val) => {
        expect(val).toHaveLength(length);
      });
    });
  });

  it('should create mock dates that respect the specified min and max dates', () => {
    const min = new Date('2022-01-01T00:00:00.000Z');
    const max = new Date('2023-01-01T00:00:00.000Z');

    const schema = z.object({
      dateWithMin: z.date().min(min),
      dateWithMax: z.date().max(max),
      dateWithRange: z.date().min(min).max(max),
      dateWithInvertedRange: z.date().min(max).max(min),
    });
    const mockData = generateMock(schema);

    expect(mockData.dateWithMin.getTime()).toBeGreaterThanOrEqual(
      min.getTime()
    );
    expect(mockData.dateWithMax.getTime()).toBeLessThanOrEqual(max.getTime());
    expect(mockData.dateWithRange.getTime()).toBeGreaterThanOrEqual(
      min.getTime()
    );
    expect(mockData.dateWithRange.getTime()).toBeLessThanOrEqual(max.getTime());
    expect(mockData.dateWithInvertedRange).toBeUndefined();
  });

  describe('arrays', () => {
    it('should mock an array without min or max', () => {
      const schema = z.object({
        data: z.array(z.string()),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.length).toBeTruthy();
      expect(typeof mockData.data[0] === 'string');
    });

    it('should mock an array with a min, but no max', () => {
      const schema = z.object({
        data: z.array(z.string()).min(3),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.length).toBeGreaterThanOrEqual(3);
      expect(typeof mockData.data[0] === 'string');
    });

    it('should mock an array with a max, but no min', () => {
      const schema = z.object({
        data: z.array(z.string()).max(1),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.length).toEqual(1);
      expect(typeof mockData.data[0] === 'string');
    });

    it('should mock an array of length 10', () => {
      const schema = z.object({
        data: z.array(z.string()).length(10),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.length).toEqual(10);
      expect(typeof mockData.data[0] === 'string');
    });

    it('should accurately mock a zero length array', () => {
      const schema = z.object({
        alwaysEmpty: z.array(z.string()).max(0),
      });
      const mockData = generateMock(schema);
      expect(mockData.alwaysEmpty.length).toEqual(0);
    });

    it('should generate different value instances per array element', () => {
      const schema = z.object({
        data: z.array(z.date()).length(2),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.length).toEqual(2);
      // even if the two dates represent the same instant in time,
      // they should not be the same instance if we are mocking each
      // array element separately.
      expect(mockData.data[0] === mockData.data[1]).toBeFalsy();
    });
  });
  describe('Sets', () => {
    it('should mock an set without min or max', () => {
      const schema = z.object({
        data: z.set(z.string()),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.size).toBeTruthy();
      expect(typeof [...mockData.data.values()][0] === 'string');
    });

    it('should mock an set with a min, but no max', () => {
      const schema = z.object({
        data: z.set(z.string()).min(3),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.size).toBeGreaterThanOrEqual(3);
      expect(typeof [...mockData.data.values()][0] === 'string');
    });

    it('should mock an set with a max, but no min', () => {
      const schema = z.object({
        data: z.set(z.string()).max(1),
      });
      const mockData = generateMock(schema);
      expect(mockData.data.size).toEqual(1);
      expect(typeof [...mockData.data.values()][0] === 'string');
    });

    it('should mock an set of size 10', () => {
      const setSchema = z.set(z.string()).size(10);
      const schema = z.object({
        data: setSchema,
      });

      expect(setSchema._def.maxSize?.value).toBe(10);
      expect(setSchema._def.minSize?.value).toBe(10);
      const mockData = generateMock(schema);
      expect(mockData.data.size).toEqual(10);
      expect(typeof [...mockData.data.values()][0] === 'string');
    });

    it('should accurately mock a zero size set', () => {
      const schema = z.object({
        alwaysEmpty: z.set(z.string()).max(0),
      });
      const mockData = generateMock(schema);
      expect(mockData.alwaysEmpty.size).toEqual(0);
    });

    it('should generate different value instances per set element', () => {
      const schema = z.object({
        data: z.set(z.date()).size(2),
      });
      const mockData = generateMock(schema);

      expect(mockData.data.size).toEqual(2);
      const values = [...mockData.data.values()];
      // even if the two dates represent the same instant in time,
      // they should not be the same instance if we are mocking each
      // set element separately.
      expect(values[0] === values[1]).toBeFalsy();
    });
  });

  it('should create Maps', () => {
    const schema = z.map(z.string(), z.number());
    const generated = generateMock(schema);

    expect(generated.size).toBeGreaterThan(0);
    const entries = [...generated.entries()];
    entries.forEach(([k, v]) => {
      expect(k).toBeTruthy();
      expect(v).toBeTruthy();
    });
  });
  describe('backup mocks', () => {
    const notUndefined = () => 'not undefined';
    it('should use a user provided generator when a generator for the schema type cannot be found', () => {
      // undefined is used because we have no reason to create a generator for it because the net result
      // will be undefined.
      const mock = generateMock(z.undefined(), {
        backupMocks: { ZodUndefined: notUndefined },
      });
      expect(mock).toEqual(notUndefined());
    });

    it('should work with objects and arrays', () => {
      const schema = z.object({
        data: z.array(z.undefined()).length(1),
      });
      const mock = generateMock(schema, {
        backupMocks: { ZodUndefined: notUndefined },
      });
      expect(mock.data[0]).toEqual(notUndefined());
    });

    it('should work with the README example', () => {
      const schema = z.object({
        anyVal: z.any(),
      });

      const mockData = generateMock(schema, {
        backupMocks: {
          ZodAny: () => 'any value',
        },
      });
      expect(mockData.anyVal).toEqual('any value');
    });
  });

  it('throws an error when configured to if we have not implemented the type mapping', () => {
    expect(() =>
      generateMock(z.any(), { throwOnUnknownType: true })
    ).toThrowError(ZodMockError);
  });

  // TODO: enable tests as their test types are implemented
  xdescribe('missing types', () => {
    it('ZodAny', () => {
      expect(generateMock(z.any())).toBeTruthy();
    });
    it('ZodUnknown', () => {
      expect(generateMock(z.unknown())).toBeTruthy();
    });
  });

  it('ZodDefault', () => {
    const value = generateMock(z.string().default('a'));
    expect(value).toBeTruthy();
    expect(typeof value).toBe('string');
  });

  it('ZodFunction', () => {
    const func = generateMock(z.function(z.tuple([]), z.string()));
    expect(func).toBeTruthy();
    expect(typeof func()).toBe('string');
  });

  it('ZodIntersection', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    const EmployedPerson = z.intersection(Person, Employee);
    const generated = generateMock(EmployedPerson);
    expect(generated).toBeTruthy();
    expect(generated.name).toBeTruthy();
    expect(generated.role).toBeTruthy();
  });

  it('ZodPromise', async () => {
    const promise = generateMock(z.promise(z.string()));
    expect(promise).toBeTruthy();
    const result = await promise;
    expect(typeof result).toBe('string');
  });

  describe('ZodTuple', () => {
    it('basic tuple', () => {
      const generated = generateMock(
        z.tuple([z.number(), z.string(), z.boolean()])
      );
      expect(generated).toBeTruthy();
      const [num, str, bool] = generated;

      expect(typeof num).toBe('number');
      expect(typeof str).toBe('string');
      expect(typeof bool).toBe('boolean');
    });

    it('tuple with Rest args', () => {
      const generated = generateMock(
        z.tuple([z.number(), z.boolean()]).rest(z.string())
      );
      expect(generated).toBeTruthy();
      const [num, bool, ...rest] = generated;

      expect(typeof num).toBe('number');
      expect(typeof bool).toBe('boolean');
      expect(rest.length).toBeGreaterThan(0);
      for (const item of rest) {
        expect(typeof item).toBe('string');
      }
    });
  });
  it('ZodUnion', () => {
    expect(generateMock(z.union([z.number(), z.string()]))).toBeTruthy();
  });

  it(`Avoid depreciations in strings`, () => {
    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    generateMock(
      z.object({
        image: z.string(),
        number: z.string(),
        float: z.string(),
        uuid: z.string(),
        boolean: z.string(),
        hexaDecimal: z.string(),
      })
    );
    expect(warn).toBeCalledTimes(0);
  });

  it('should generate strings from regex', () => {
    const regResult = generateMock(
      z.object({
        data: z.string().regex(/^[A-Z0-9+_.-]+@[A-Z0-9.-]+$/),
      })
    );
    expect(regResult.data).toMatch(/^[A-Z0-9+_.-]+@[A-Z0-9.-]+$/);
  });

  it('should handle complex unions', () => {
    const result = generateMock(z.object({ date: z.date() }));
    expect(result.date).toBeInstanceOf(Date);

    // Date
    const variousTypes = z.union([
      z
        .string()
        .min(1)
        .max(100)
        .transform((v) => v.length),
      z.number().gt(1).lt(100),
      z
        .string()
        .regex(/^(100|[1-9][0-9]?)$/)
        .transform((v) => parseInt(v)),
    ]);
    const TransformItem = z.object({
      id: z.string().nonempty({ message: 'Missing ID' }),
      name: z.string().optional(),
      items: variousTypes,
    });
    const transformResult = generateMock(TransformItem);
    expect(transformResult.items).toBeGreaterThan(0);
    expect(transformResult.items).toBeLessThan(101);
  });

  it('should handle discriminated unions', () => {
    const FirstType = z.object({
      hasEmail: z.literal(false),
      userName: z.string(),
    });

    const SecondType = z.object({
      hasEmail: z.literal(true),
      email: z.string(),
    });

    const Union = z.discriminatedUnion('hasEmail', [FirstType, SecondType]);

    const result = generateMock(Union);
    expect(result).toBeDefined();

    if (result.hasEmail) {
      expect(result.email).toBeTruthy();
    } else {
      expect(result.userName).toBeTruthy();
    }
  });

  it('should handle branded types', () => {
    const Branded = z.string().brand<'__brand'>();

    const result = generateMock(Branded);
    expect(result).toBeTruthy();
  });

  it('ZodVoid', () => {
    expect(generateMock(z.void())).toBeUndefined();
  });
  it('ZodNull', () => {
    expect(generateMock(z.null())).toBeNull();
  });
  it('ZodNaN', () => {
    expect(generateMock(z.nan())).toBeNaN();
  });
  it('ZodUndefined', () => {
    expect(generateMock(z.undefined())).toBeUndefined();
  });
  it('ZodLazy', () => {
    expect(generateMock(z.lazy(() => z.string()))).toBeTruthy();
  });

  it('Options seed value will return the same random numbers', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const seed = 123;
    const first = generateMock(schema, { seed });
    const second = generateMock(schema, { seed });
    expect(first).toEqual(second);
  });

  it('Options seed value will return the same union & enum members', () => {
    enum NativeEnum {
      a = 1,
      b = 2,
    }

    const schema = z.object({
      theme: z.enum([`light`, `dark`]),
      nativeEnum: z.nativeEnum(NativeEnum),
      union: z.union([z.literal('a'), z.literal('b')]),
      discriminatedUnion: z.discriminatedUnion('discriminator', [
        z.object({ discriminator: z.literal('a'), a: z.boolean() }),
        z.object({ discriminator: z.literal('b'), b: z.string() }),
      ]),
    });
    const seed = 123;
    const first = generateMock(schema, { seed });
    const second = generateMock(schema, { seed });
    expect(first).toEqual(second);
  });

  it('Options seed value will return the same generated regex values', () => {
    const schema = z.object({
      data: z.string().regex(/^[A-Z0-9+_.-]+@[A-Z0-9.-]+$/),
    });
    const seed = 123;
    const first = generateMock(schema, { seed });
    const second = generateMock(schema, { seed });
    expect(first).toEqual(second);
  });

  it('Can use my own version of faker', () => {
    enum NativeEnum {
      a = 1,
      b = 2,
    }

    const schema = z.object({
      uid: z.string().nonempty(),
      theme: z.enum([`light`, `dark`]),
      name: z.string(),
      firstName: z.string(),
      email: z.string().email().optional(),
      phoneNumber: z.string().min(10).optional(),
      avatar: z.string().url().optional(),
      jobTitle: z.string().optional(),
      otherUserEmails: z.array(z.string().email()),
      stringArrays: z.array(z.string()),
      stringLength: z.string().transform((val) => val.length),
      numberCount: z.number().transform((item) => `total value = ${item}`),
      age: z.number().min(18).max(120),
      record: z.record(z.string(), z.number()),
      nativeEnum: z.nativeEnum(NativeEnum),
      set: z.set(z.string()),
      map: z.map(z.string(), z.number()),
      discriminatedUnion: z.discriminatedUnion('discriminator', [
        z.object({ discriminator: z.literal('a'), a: z.boolean() }),
        z.object({ discriminator: z.literal('b'), b: z.string() }),
      ]),
      dateWithMin: z.date().min(new Date('2023-01-01T00:00:00Z')),
    });

    faker.seed(3);
    const first = generateMock(schema, { faker });
    faker.seed(3);
    const second = generateMock(schema, { faker });
    const third = generateMock(schema);
    expect(first).toEqual(second);
    expect(first).not.toEqual(third);
  });
});
