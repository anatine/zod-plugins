/* eslint-disable @typescript-eslint/no-explicit-any */
import * as faker from 'faker';
import { AnyZodObject, z, ZodTypeAny } from 'zod';

function parseObject(zodRef: AnyZodObject): Record<string, ZodTypeAny> {
  return Object.keys(zodRef.shape).reduce(
    (carry, key) => ({
      ...carry,
      [key]: generateMock<ZodTypeAny>(zodRef.shape[key], key),
    }),
    {} as Record<string, ZodTypeAny>
  );
}

function findMatchingFaker(keyName: string) {
  let fnName: string | undefined = undefined;
  const sectionName = Object.keys(faker).find((sectionKey) => {
    Object.keys(faker[sectionKey as never]).find((fnKey) => {
      fnName =
        fnKey.toLowerCase() === keyName.toLowerCase() ? keyName : undefined;
      return fnName;
    });
  }) as never;
  if (sectionName && fnName) {
    return faker[sectionName][fnName];
  }
}

function parseString(zodRef: z.ZodString, keyName?: string): string {
  const { checks = [] } = zodRef._def;

  const stringGenerators = {
    default: keyName
      ? findMatchingFaker(keyName) ?? faker.random.word
      : faker.random.word,
    email: faker.internet.exampleEmail,
    uuid: faker.datatype.uuid,
    uid: faker.datatype.uuid,
    url: faker.internet.url,
  };
  const stringType =
    (Object.keys(stringGenerators).find(
      (genKey) =>
        genKey === keyName?.toLowerCase() ||
        checks.find((item) => item.kind === genKey)
    ) as keyof typeof stringGenerators) || 'default';

  return stringGenerators[stringType]();
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
  keyName?: string
) {
  return generateMock<ZodTypeAny>(zodRef.unwrap(), keyName);
}

function parseArray(zodRef: z.ZodArray<never>, keyName?: string) {
  const s = generateMock<ZodTypeAny>(zodRef._def.type, keyName);
  return [s, s, s, s, s].map(() =>
    generateMock<ZodTypeAny>(zodRef._def.type, keyName)
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
  keyName?: string
) {
  const input = generateMock(zodRef._def.schema, keyName);

  const effect =
    zodRef._def.effects &&
    zodRef._def.effects.filter((ef) => ef.type === 'transform').slice(-1)[0];

  if (effect && 'transform' in effect) return effect.transform(input);

  return input;
}

const workerMap = {
  ZodObject: parseObject,
  ZodRecord: parseObject,
  ZodString: parseString,
  ZodNumber: parseNumber,
  ZodBigInt: parseNumber,
  ZodBoolean: () => faker.datatype.boolean(),
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

export function generateMock<T extends ZodTypeAny>(
  zodRef: T,
  keyName?: string
): z.infer<typeof zodRef> {
  try {
    const typeName = zodRef._def.typeName as WorkerKeys;
    if (typeName in workerMap) {
      return workerMap[typeName](zodRef as never, keyName);
    }
    return undefined;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
