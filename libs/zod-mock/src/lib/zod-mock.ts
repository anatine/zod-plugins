/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker';
import { AnyZodObject, z, ZodTypeAny } from 'zod';

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

type fakerFunction = () => string | number | boolean;

function findMatchingFaker(keyName: string): undefined | fakerFunction {
  const lowerCaseKeyName = keyName.toLowerCase();
  const withoutDashesUnderscores = lowerCaseKeyName.replace(/_|-/g, '');
  let fnName: string | undefined = undefined;
  const sectionName = Object.keys(faker).find((sectionKey) => {
    return Object.keys(faker[sectionKey as keyof typeof faker]).find((fnKey) => {
      const lower = fnKey.toLowerCase();
      fnName =
        lower === lowerCaseKeyName || lower === withoutDashesUnderscores ? keyName : undefined;
      if (fnName) {
        const fn = faker[sectionKey as keyof typeof faker]?.[fnName];
        if (typeof fn === 'function') {
          try {
            // some Faker functions, such as `faker.mersenne.seed`, are known to throw errors if called
            // with incorrect parameters
            const mock = fn();
            return typeof mock === 'string'
            || typeof mock === 'number'
            || typeof mock === 'boolean'
            ? fnName
            : undefined;
          } catch (_error) {
            // do nothing. undefined will be returned eventually.
          }
        }
      }
      return undefined;
    });
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

  const stringGenerators = {
    default: faker.lorem.word,
    email: faker.internet.exampleEmail,
    uuid: faker.datatype.uuid,
    uid: faker.datatype.uuid,
    url: faker.internet.url,
    name: faker.name.findName,
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
    ...options?.stringMap,
  };

  const stringType =
    (Object.keys(stringGenerators).find(
      (genKey) =>
        genKey === options?.keyName?.toLowerCase() ||
        checks.find((item) => item.kind === genKey)
    ) as keyof typeof stringGenerators) || null;

  if (stringType) {
    return stringGenerators[stringType]();
  } else {
    const foundFaker = options?.keyName
      ? findMatchingFaker(options?.keyName)
      : undefined;
    if (foundFaker) {
      return foundFaker();
    }
  }

  return faker.lorem.word();
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
  const s = generateMock<ZodTypeAny>(zodRef._def.type, options);
  return [s, s, s, s, s].map(() =>
    generateMock<ZodTypeAny>(zodRef._def.type, options)
  );
}

function parseEnum(zodRef: z.ZodEnum<never> | z.ZodNativeEnum<never>) {
  const values = zodRef._def.values as Array<z.infer<typeof zodRef>>;
  const pick = Math.floor(Math.random() * values.length);
  return values[pick];
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

  return effect.transform(input);
}

const workerMap = {
  ZodObject: parseObject,
  ZodRecord: parseObject,
  ZodString: parseString,
  ZodNumber: parseNumber,
  ZodBigInt: parseNumber,
  ZodBoolean: () => faker.datatype.boolean(),
  ZodDate: () => faker.date.soon(),
  ZodOptional: parseOptional,
  ZodNullable: parseOptional,
  ZodArray: parseArray,
  ZodEnum: parseEnum,
  ZodNativeEnum: parseEnum,
  ZodLiteral: parseLiteral,
  ZodTransformer: parseTransform,
  ZodEffects: parseTransform,
};
type WorkerKeys = keyof typeof workerMap;

export interface GenerateMockOptions {
  keyName?: string;
  stringMap?: Record<string, (args: any) => string>;
}

export function generateMock<T extends ZodTypeAny>(
  zodRef: T,
  options?: GenerateMockOptions
): z.infer<typeof zodRef> {
  try {
    const typeName = zodRef._def.typeName as WorkerKeys;
    if (typeName in workerMap) {
      return workerMap[typeName](zodRef as never, options);
    }
    return undefined;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
