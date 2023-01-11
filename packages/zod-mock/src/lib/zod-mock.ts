/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker';
import * as randExp from 'randexp';
import {
  AnyZodObject,
  z,
  ZodTypeAny,
  ZodType,
  ZodString,
  ZodRecord,
  number,
} from 'zod';

type FakerClass = typeof faker;

function parseObject(
  zodRef: AnyZodObject,
  options?: GenerateMockOptions
): Record<string, ZodTypeAny> {
  return Object.keys(zodRef.shape).reduce(
    (carry, key) => ({
      ...carry,
      [key]: generateMock<ZodTypeAny>(zodRef.shape[key], {
        ...options,
        keyName: key,
      }),
    }),
    {} as Record<string, ZodTypeAny>
  );
}

function parseRecord<
  Key extends ZodType<string | number | symbol, any, any> = ZodString,
  Value extends ZodTypeAny = ZodTypeAny
>(zodRef: ZodRecord<Key, Value>, options?: GenerateMockOptions) {
  const recordKeysLength = options?.recordKeysLength || 1;

  return new Array(recordKeysLength).fill(null).reduce((prev) => {
    return {
      ...prev,
      [generateMock(zodRef.keySchema, options)]: generateMock(
        zodRef.valueSchema,
        options
      ),
    };
  }, {});
}

type fakerFunction = () => string | number | boolean | Date;

function findMatchingFaker(
  keyName: string,
  fakerOption?: FakerClass
): undefined | fakerFunction | void {
  const fakerInstance = fakerOption || faker;
  const lowerCaseKeyName = keyName.toLowerCase();
  const withoutDashesUnderscores = lowerCaseKeyName.replace(/_|-/g, '');
  let fnName: string | undefined = undefined;
  const sectionName = Object.keys(fakerInstance).find((sectionKey) => {
    return Object.keys(
      fakerInstance[sectionKey as keyof FakerClass] || {}
    ).find((fnKey) => {
      const lower = fnKey.toLowerCase();
      fnName =
        lower === lowerCaseKeyName || lower === withoutDashesUnderscores
          ? keyName
          : undefined;

      // Skipping depreciated items
      const depreciated: Record<string, string[]> = {
        random: ['image', 'number', 'float', 'uuid', 'boolean', 'hexaDecimal'],
      };
      if (
        Object.keys(depreciated).find((key) =>
          key === sectionKey
            ? depreciated[key].find((fn) => fn === fnName)
            : false
        )
      ) {
        return undefined;
      }

      if (fnName) {
        // TODO: it would be good to clean up these type castings
        const fn = fakerInstance[sectionKey as keyof FakerClass]?.[
          fnName as never
        ] as any;
        if (typeof fn === 'function') {
          try {
            // some Faker functions, such as `faker.mersenne.seed`, are known to throw errors if called
            // with incorrect parameters
            const mock = fn();
            return typeof mock === 'string' ||
              typeof mock === 'number' ||
              typeof mock === 'boolean' ||
              mock instanceof Date
              ? fnName
              : undefined;
          } catch (_error) {
            // do nothing. undefined will be returned eventually.
          }
        }
      }
      return undefined;
    });
  }) as keyof FakerClass;
  if (sectionName && fnName) {
    const section = fakerInstance[sectionName];
    return section ? section[fnName] : undefined;
  }
}

function parseString(
  zodRef: z.ZodString,
  options?: GenerateMockOptions
): string | number | boolean {
  const fakerInstance = options?.faker || faker;
  const { checks = [] } = zodRef._def;

  const regexCheck = checks.find((check) => check.kind === 'regex');
  if (regexCheck && 'regex' in regexCheck) {
    const generator = new randExp(regexCheck.regex);
    generator.randInt = (min: number, max: number) =>
      fakerInstance.datatype.number({ min, max });
    const max = checks.find((check) => check.kind === 'max');
    if (max && 'value' in max && typeof max.value === 'number') {
      generator.max = max.value;
    }
    const genRegString = generator.gen();
    return genRegString;
  }

  const lowerCaseKeyName = options?.keyName?.toLowerCase();
  // Prioritize user provided generators.
  if (options?.keyName && options.stringMap) {
    // min/max length handling is not applied here
    const generator = options.stringMap[options.keyName];
    if (generator) {
      return generator();
    }
  }
  const stringOptions: {
    min?: number;
    max?: number;
  } = {};

  checks.forEach((item) => {
    switch (item.kind) {
      case 'min':
        stringOptions.min = item.value;
        break;
      case 'max':
        stringOptions.max = item.value;
        break;
    }
  });

  const sortedStringOptions = {
    ...stringOptions,
  };

  // avoid Max {Max} should be greater than min {Min}
  if (
    sortedStringOptions.min &&
    sortedStringOptions.max &&
    sortedStringOptions.min > sortedStringOptions.max
  ) {
    const temp = sortedStringOptions.min;
    sortedStringOptions.min = sortedStringOptions.max;
    sortedStringOptions.max = temp;
  }

  const targetStringLength = fakerInstance.datatype.number(sortedStringOptions);
  /**
   * Returns a random lorem word using `faker.lorem.word(length)`.
   * This method can return undefined for large word lengths. If undefined is returned
   * when specifying a large word length, will return `faker.lorem.word()` instead.
   */
  const defaultGenerator = () =>
    fakerInstance.lorem.word(targetStringLength) || fakerInstance.lorem.word();
  const dateGenerator = () => fakerInstance.date.recent().toISOString();
  const stringGenerators = {
    default: defaultGenerator,
    email: fakerInstance.internet.exampleEmail,
    uuid: fakerInstance.datatype.uuid,
    uid: fakerInstance.datatype.uuid,
    url: fakerInstance.internet.url,
    name: fakerInstance.name.fullName,
    date: dateGenerator,
    dateTime: dateGenerator,
    colorHex: fakerInstance.internet.color,
    color: fakerInstance.internet.color,
    backgroundColor: fakerInstance.internet.color,
    textShadow: fakerInstance.internet.color,
    textColor: fakerInstance.internet.color,
    textDecorationColor: fakerInstance.internet.color,
    borderColor: fakerInstance.internet.color,
    borderTopColor: fakerInstance.internet.color,
    borderRightColor: fakerInstance.internet.color,
    borderBottomColor: fakerInstance.internet.color,
    borderLeftColor: fakerInstance.internet.color,
    borderBlockStartColor: fakerInstance.internet.color,
    borderBlockEndColor: fakerInstance.internet.color,
    borderInlineStartColor: fakerInstance.internet.color,
    borderInlineEndColor: fakerInstance.internet.color,
    columnRuleColor: fakerInstance.internet.color,
    outlineColor: fakerInstance.internet.color,
    phoneNumber: fakerInstance.phone.number,
  };

  const stringType =
    (Object.keys(stringGenerators).find(
      (genKey) =>
        genKey.toLowerCase() === lowerCaseKeyName ||
        checks.find((item) => item.kind === genKey)
    ) as keyof typeof stringGenerators) || null;

  let generator: fakerFunction = defaultGenerator;

  if (stringType) {
    generator = stringGenerators[stringType];
  } else {
    const foundFaker = options?.keyName
      ? findMatchingFaker(options?.keyName, options.faker)
      : undefined;
    if (foundFaker) {
      generator = foundFaker;
    }
  }

  // it's possible for a zod schema to be defined with a
  // min that is greater than the max. While that schema
  // will never parse without producing errors, we will prioritize
  // the max value because exceeding it represents a potential security
  // vulnerability (buffer overflows).
  let val = generator().toString();
  const delta = targetStringLength - val.length;
  if (stringOptions.min != null && val.length < stringOptions.min) {
    val = val + fakerInstance.random.alpha(delta);
  }

  return val.slice(0, stringOptions.max);
}

function parseBoolean(zodRef: z.ZodBoolean, options?: GenerateMockOptions) {
  const fakerInstance = options?.faker || faker;
  return fakerInstance.datatype.boolean();
}

function parseDate(zodRef: z.ZodDate, options?: GenerateMockOptions) {
  const fakerInstance = options?.faker || faker;
  const { checks = [] } = zodRef._def;
  let min: number | undefined;
  let max: number | undefined;

  checks.forEach((item) => {
    switch (item.kind) {
      case 'min':
        min = item.value;
        break;
      case 'max':
        max = item.value;
        break;
    }
  });

  if (min !== undefined && max !== undefined) {
    return fakerInstance.date.between(min, max);
  } else if (min !== undefined && max === undefined) {
    return fakerInstance.date.soon(undefined, min);
  } else if (min === undefined && max !== undefined) {
    return fakerInstance.date.recent(undefined, max);
  } else {
    return fakerInstance.date.soon();
  }
}

function parseNumber(
  zodRef: z.ZodNumber,
  options?: GenerateMockOptions
): number {
  const fakerInstance = options?.faker || faker;
  const { checks = [] } = zodRef._def;
  const fakerOptions: any = {};

  checks.forEach((item) => {
    switch (item.kind) {
      case 'int':
        break;
      case 'min':
        fakerOptions.min = item.value;
        break;
      case 'max':
        fakerOptions.max = item.value;
        break;
    }
  });
  return fakerInstance.datatype.number(fakerOptions);
}

function parseOptional(
  zodRef: z.ZodOptional<ZodTypeAny> | z.ZodNullable<ZodTypeAny>,
  options?: GenerateMockOptions
) {
  return generateMock<ZodTypeAny>(zodRef.unwrap(), options);
}

function parseArray(zodRef: z.ZodArray<never>, options?: GenerateMockOptions) {
  const fakerInstance = options?.faker || faker;
  let min = zodRef._def.minLength?.value ?? zodRef._def.exactLength?.value ?? 1;
  const max =
    zodRef._def.maxLength?.value ?? zodRef._def.exactLength?.value ?? 5;

  // prevents arrays from exceeding the max regardless of the min.
  if (min > max) {
    min = max;
  }
  const targetLength = fakerInstance.datatype.number({ min, max });
  const results: ZodTypeAny[] = [];
  for (let index = 0; index < targetLength; index++) {
    results.push(generateMock<ZodTypeAny>(zodRef._def.type, options));
  }
  return results;
}

function parseSet(zodRef: z.ZodSet<never>, options?: GenerateMockOptions) {
  const fakerInstance = options?.faker || faker;
  let min = zodRef._def.minSize?.value != null ? zodRef._def.minSize.value : 1;
  const max =
    zodRef._def.maxSize?.value != null ? zodRef._def.maxSize.value : 5;

  // prevents arrays from exceeding the max regardless of the min.
  if (min > max) {
    min = max;
  }
  const targetLength = fakerInstance.datatype.number({ min, max });
  const results = new Set<ZodTypeAny>();
  while (results.size < targetLength) {
    results.add(generateMock<ZodTypeAny>(zodRef._def.valueType, options));
  }

  return results;
}

function parseMap(zodRef: z.ZodMap<never>, options?: GenerateMockOptions) {
  const targetLength = options?.mapEntriesLength ?? 1;
  const results = new Map<ZodTypeAny, ZodTypeAny>();

  while (results.size < targetLength) {
    results.set(
      generateMock<ZodTypeAny>(zodRef._def.keyType, options),
      generateMock<ZodTypeAny>(zodRef._def.valueType, options)
    );
  }
  return results;
}

function parseEnum(
  zodRef: z.ZodEnum<never> | z.ZodNativeEnum<never>,
  options?: GenerateMockOptions
) {
  const fakerInstance = options?.faker || faker;
  const values = zodRef._def.values as Array<z.infer<typeof zodRef>>;
  return fakerInstance.helpers.arrayElement(values);
}

function parseDiscriminatedUnion(
  zodRef: z.ZodDiscriminatedUnion<never, any>,
  options?: GenerateMockOptions
) {
  const fakerInstance = options?.faker || faker;
  // Map the options to various possible union cases
  const potentialCases = [...zodRef._def.options.values()];
  const mocked = fakerInstance.helpers.arrayElement(potentialCases);
  return generateMock(mocked, options);
}

function parseNativeEnum(
  zodRef: z.ZodNativeEnum<never>,
  options?: GenerateMockOptions
) {
  const fakerInstance = options?.faker || faker;
  const { values } = zodRef._def;
  const value = fakerInstance.helpers.arrayElement(values);
  return values[value];
}

function parseLiteral(zodRef: z.ZodLiteral<any>) {
  return zodRef._def.value;
}

function parseTransform(
  zodRef: z.ZodTransformer<never> | z.ZodEffects<never>,
  options?: GenerateMockOptions
) {
  const input = generateMock(zodRef._def.schema, options);

  const effect =
    zodRef._def.effect.type === 'transform'
      ? zodRef._def.effect
      : { transform: () => input };

  return effect.transform(input, { addIssue: () => undefined, path: [] }); // TODO : Discover if context is necessary here
}

function parseUnion(
  zodRef: z.ZodUnion<Readonly<[ZodTypeAny, ...ZodTypeAny[]]>>,
  options?: GenerateMockOptions
) {
  const fakerInstance = options?.faker || faker;
  // Map the options to various possible mock values
  const potentialCases = [...zodRef._def.options.values()];
  const mocked = fakerInstance.helpers.arrayElement(potentialCases);
  return generateMock(mocked, options);
}

function parseZodIntersection(
  zodRef: z.ZodIntersection<ZodTypeAny, ZodTypeAny>,
  options?: GenerateMockOptions
) {
  const left = generateMock(zodRef._def.left, options);
  const right = generateMock(zodRef._def.right, options);

  return Object.assign(left, right);
}
function parseZodTuple(
  zodRef: z.ZodTuple<[], never>,
  options?: GenerateMockOptions
) {
  const results: ZodTypeAny[] = [];
  zodRef._def.items.forEach((def) => {
    results.push(generateMock(def, options));
  });

  if (zodRef._def.rest !== null) {
    const next = parseArray(z.array(zodRef._def.rest), options);
    results.push(...(next ?? []));
  }
  return results;
}

function parseZodFunction(
  zodRef: z.ZodFunction<z.ZodTuple<any, any>, ZodTypeAny>,
  options?: GenerateMockOptions
) {
  return function zodMockFunction() {
    return generateMock(zodRef._def.returns, options);
  };
}

function parseZodDefault(
  zodRef: z.ZodDefault<ZodTypeAny>,
  options?: GenerateMockOptions
) {
  const fakerInstance = options?.faker || faker;
  // Use the default value 50% of the time
  if (fakerInstance.datatype.boolean()) {
    return zodRef._def.defaultValue();
  } else {
    return generateMock(zodRef._def.innerType, options);
  }
}

function parseZodPromise(
  zodRef: z.ZodPromise<ZodTypeAny>,
  options?: GenerateMockOptions
) {
  return Promise.resolve(generateMock(zodRef._def.type, options));
}

function parseBranded(
  zodRef: z.ZodBranded<ZodTypeAny, never>,
  options?: GenerateMockOptions
) {
  return generateMock(zodRef.unwrap(), options);
}

function parseLazy(
  zodRef: z.ZodLazy<ZodTypeAny>,
  options?: GenerateMockOptions
) {
  return generateMock(zodRef._def.getter(), options);
}

const workerMap = {
  ZodObject: parseObject,
  ZodRecord: parseRecord,
  ZodString: parseString,
  ZodNumber: parseNumber,
  ZodBigInt: parseNumber,
  ZodBoolean: parseBoolean,
  ZodDate: parseDate,
  ZodOptional: parseOptional,
  ZodNullable: parseOptional,
  ZodArray: parseArray,
  ZodEnum: parseEnum,
  ZodNativeEnum: parseNativeEnum,
  ZodLiteral: parseLiteral,
  ZodTransformer: parseTransform,
  ZodEffects: parseTransform,
  ZodUnion: parseUnion,
  ZodSet: parseSet,
  ZodMap: parseMap,
  ZodDiscriminatedUnion: parseDiscriminatedUnion,
  ZodIntersection: parseZodIntersection,
  ZodTuple: parseZodTuple,
  ZodFunction: parseZodFunction,
  ZodDefault: parseZodDefault,
  ZodPromise: parseZodPromise,
  ZodLazy: parseLazy,
  ZodBranded: parseBranded,
  ZodNull: () => null,
  ZodNaN: () => NaN,
};

type WorkerKeys = keyof typeof workerMap;

export interface GenerateMockOptions {
  keyName?: string;
  /**
   * Note: callback functions are not called with any
   * parameters at this time.
   */
  stringMap?: Record<string, (...args: any[]) => string>;

  /**
   * This is a mapping of field name to mock generator function.
   * This mapping can be used to provide backup mock
   * functions for Zod types not yet implemented in {@link WorkerKeys}.
   * The functions in this map will only be used if this library
   * is unable to find an appropriate mocking function to use.
   */
  backupMocks?: Record<string, () => any | undefined>;

  /**
   * How many entries to create for records
   */
  recordKeysLength?: number;

  /**
   * How many entries to create for Maps
   */
  mapEntriesLength?: number;

  /**
   * Set to true to throw an exception instead of returning undefined when encountering an unknown `ZodType`
   */
  throwOnUnknownType?: boolean;

  /**
   * Set a seed for random generation
   */
  seed?: number | number[];

  /**
   * Faker class instance for mocking
   */
  faker?: FakerClass;
}

export function generateMock<T extends ZodTypeAny>(
  zodRef: T,
  options?: GenerateMockOptions
): z.infer<typeof zodRef> {
  try {
    const fakerInstance = options?.faker || faker;
    if (options?.seed) {
      fakerInstance.seed(
        Array.isArray(options.seed) ? options.seed : [options.seed]
      );
    }
    const typeName = zodRef._def.typeName as WorkerKeys;
    if (typeName in workerMap) {
      return workerMap[typeName](zodRef as never, options);
    } else if (options?.backupMocks && typeName in options.backupMocks) {
      // check for a generator match in the options.
      // workaround for unimplemented Zod types
      const generator = options.backupMocks[typeName];
      if (generator) {
        return generator();
      }
    } else if (options?.throwOnUnknownType) {
      throw new ZodMockError(typeName);
    }
    return undefined;
  } catch (err) {
    if (err instanceof ZodMockError) {
      throw err;
    }
    console.error(err);
    return undefined;
  }
}

export class ZodMockError extends Error {
  constructor(public typeName: string) {
    super(`Unable to generate a mock value for ZodType ${typeName}.`);
  }
}
