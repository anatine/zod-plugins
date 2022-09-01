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
} from 'zod';

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

function findMatchingFaker(keyName: string): undefined | fakerFunction | void {
  const lowerCaseKeyName = keyName.toLowerCase();
  const withoutDashesUnderscores = lowerCaseKeyName.replace(/_|-/g, '');
  let fnName: string | undefined = undefined;
  const sectionName = Object.keys(faker).find((sectionKey) => {
    return Object.keys(faker[sectionKey as keyof typeof faker] || {}).find(
      (fnKey) => {
        const lower = fnKey.toLowerCase();
        fnName =
          lower === lowerCaseKeyName || lower === withoutDashesUnderscores
            ? keyName
            : undefined;

        // Skipping depreciated items
        const depreciated: Record<string, string[]> = {
          random: [
            'image',
            'number',
            'float',
            'uuid',
            'boolean',
            'hexaDecimal',
          ],
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
          const fn = faker[sectionKey as keyof typeof faker]?.[
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
      }
    );
  }) as keyof typeof faker;
  if (sectionName && fnName) {
    const section = faker[sectionName];
    return section ? section[fnName] : undefined;
  }
}

function parseString(
  zodRef: z.ZodString,
  options?: GenerateMockOptions
): string | number | boolean {
  const { checks = [] } = zodRef._def;

  const regexCheck = checks.find((check) => check.kind === 'regex');
  if (regexCheck && 'regex' in regexCheck) {
    const generator = new randExp(regexCheck.regex);
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

  const targetStringLength = faker.datatype.number(sortedStringOptions);
  /**
   * Returns a random lorem word using `faker.lorem.word(length)`.
   * This method can return undefined for large word lengths. If undefined is returned
   * when specifying a large word length, will return `faker.lorem.word()` instead.
   */
  const defaultGenerator = () =>
    faker.lorem.word(targetStringLength) || faker.lorem.word();
  const dateGenerator = () => faker.date.recent().toISOString();
  const stringGenerators = {
    default: defaultGenerator,
    email: faker.internet.exampleEmail,
    uuid: faker.datatype.uuid,
    uid: faker.datatype.uuid,
    url: faker.internet.url,
    name: faker.name.fullName,
    date: dateGenerator,
    dateTime: dateGenerator,
    colorHex: faker.internet.color,
    color: faker.internet.color,
    backgroundColor: faker.internet.color,
    textShadow: faker.internet.color,
    textColor: faker.internet.color,
    textDecorationColor: faker.internet.color,
    borderColor: faker.internet.color,
    borderTopColor: faker.internet.color,
    borderRightColor: faker.internet.color,
    borderBottomColor: faker.internet.color,
    borderLeftColor: faker.internet.color,
    borderBlockStartColor: faker.internet.color,
    borderBlockEndColor: faker.internet.color,
    borderInlineStartColor: faker.internet.color,
    borderInlineEndColor: faker.internet.color,
    columnRuleColor: faker.internet.color,
    outlineColor: faker.internet.color,
    phoneNumber: faker.phone.number,
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
      ? findMatchingFaker(options?.keyName)
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
    val = val + faker.random.alpha(delta);
  }

  return val.slice(0, stringOptions.max);
}

function parseNumber(zodRef: z.ZodNumber): number {
  const { checks = [] } = zodRef._def;
  const options: any = {};

  checks.forEach((item) => {
    switch (item.kind) {
      case 'int':
        break;
      case 'min':
        options.min = item.value;
        break;
      case 'max':
        options.max = item.value;
        break;
    }
  });

  return faker.datatype.number(options);
}

function parseOptional(
  zodRef: z.ZodOptional<ZodTypeAny> | z.ZodNullable<ZodTypeAny>,
  options?: GenerateMockOptions
) {
  return generateMock<ZodTypeAny>(zodRef.unwrap(), options);
}

function parseArray(zodRef: z.ZodArray<never>, options?: GenerateMockOptions) {
  let min =
    zodRef._def.minLength?.value != null ? zodRef._def.minLength.value : 1;
  const max =
    zodRef._def.maxLength?.value != null ? zodRef._def.maxLength.value : 5;

  // prevents arrays from exceeding the max regardless of the min.
  if (min > max) {
    min = max;
  }
  const targetLength = faker.datatype.number({ min, max });
  const results: ZodTypeAny[] = [];
  for (let index = 0; index < targetLength; index++) {
    results.push(generateMock<ZodTypeAny>(zodRef._def.type, options));
  }
  return results;
}

function parseSet(zodRef: z.ZodSet<never>, options?: GenerateMockOptions) {
  let min = zodRef._def.minSize?.value != null ? zodRef._def.minSize.value : 1;
  const max =
    zodRef._def.maxSize?.value != null ? zodRef._def.maxSize.value : 5;

  // prevents arrays from exceeding the max regardless of the min.
  if (min > max) {
    min = max;
  }
  const targetLength = faker.datatype.number({ min, max });
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

function parseEnum(zodRef: z.ZodEnum<never> | z.ZodNativeEnum<never>) {
  const values = zodRef._def.values as Array<z.infer<typeof zodRef>>;
  const pick = Math.floor(Math.random() * values.length);
  return values[pick];
}

function parseNativeEnum(zodRef: z.ZodNativeEnum<never>) {
	const { values } = zodRef._def;
	const pick = Math.floor(Math.random() * (Object.values(values).length));
	const key = Array.from(Object.keys(values))[pick];
	return values[values[key]];
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
  // Map the options to various possible mock values
  const mockOptions = zodRef._def.options.map((option) =>
    generateMock(option, options)
  );
  return faker.helpers.arrayElement(mockOptions);
}

const workerMap = {
  ZodObject: parseObject,
  ZodRecord: parseRecord,
  ZodString: parseString,
  ZodNumber: parseNumber,
  ZodBigInt: parseNumber,
  ZodBoolean: () => faker.datatype.boolean(),
  ZodDate: () => faker.date.soon(),
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
}

export function generateMock<T extends ZodTypeAny>(
  zodRef: T,
  options?: GenerateMockOptions
): z.infer<typeof zodRef> {
  try {
    const typeName = zodRef._def.typeName as WorkerKeys;
    if (typeName in workerMap) {
      return workerMap[typeName](zodRef as never, options);
    } else {
      // check for a generator match in the options.
      // workaround for unimplemented Zod types
      const generator = options?.backupMocks?.[typeName];
      if (generator) {
        return generator();
      }
    }
    return undefined;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
