import { SchemaObject } from 'openapi3-ts';
import validator from 'validator';
import { z } from 'zod';
import { generateSchema, extendApi } from './zod-openapi';

describe('zodOpenapi', () => {
  /**
   * Primitives
   */
  it('should support basic primitives', () => {
    const zodSchema = extendApi(
      z.object({
        aString: z.string().optional(),
        aNumber: z.number().optional(),
        aBigInt: z.bigint(),
        aBoolean: z.boolean(),
        aDate: z.date(),
      }),
      {
        description: `Primitives also testing overwriting of "required"`,
        required: ['aNumber'], // All schema settings "merge"
      }
    );
    const apiSchema = generateSchema(zodSchema);

    expect(apiSchema).toEqual({
      type: 'object',
      properties: {
        aString: { type: 'string' },
        aNumber: { type: 'number' },
        aBigInt: { type: 'integer', format: 'int64' },
        aBoolean: { type: 'boolean' },
        aDate: { type: 'string', format: 'date-time' },
      },
      required: ['aBigInt', 'aBoolean', 'aDate', 'aNumber'],
      description: 'Primitives also testing overwriting of "required"',
    });
  });

  it('should support empty types', () => {
    const zodSchema = extendApi(
      z.object({
        aUndefined: z.undefined(),
        aNull: z.null(),
        aVoid: z.void(),
      }),
      {
        description: `Empty types in a schema`,
      }
    );
    const apiSchema = generateSchema(zodSchema);
    console.log(apiSchema);
    expect(apiSchema).toEqual({
      type: 'object',
      properties: {
        aUndefined: {},
        aNull: { type: 'string', format: 'null', nullable: true },
        aVoid: {},
      },
      required: ['aNull'],
      description: 'Empty types in a schema',
    });
  });

  it('It should support proper transform input/output', () => {
    const zodTransform = extendApi(
      z.string().transform((val) => val.length),
      { description: 'Will take in a string, returning the length' }
    );
    const schemaIn = generateSchema(zodTransform);
    expect(schemaIn.type).toEqual('string');
    const schemaOut = generateSchema(zodTransform, true);
    expect(schemaOut.type).toEqual('number');
  });

  it('should support catch-all types', () => {
    const zodSchema = extendApi(
      z.object({
        aAny: z.any(),
        aUnknown: z.unknown(),
      }),
      {
        description: `Empty types don't belong in schema`,
      }
    );
    const apiSchema = generateSchema(zodSchema);
    expect(apiSchema.properties).toBeDefined();
    expect((apiSchema.properties?.aAny as SchemaObject).nullable).toEqual(true);
    expect((apiSchema.properties?.aUnknown as SchemaObject).nullable).toEqual(
      true
    );
  });

  it('should support never type', () => {
    const zodSchema = extendApi(
      z.object({
        aNever: z.never(),
      }),
      {
        description: `Never values! Can not use them!`,
      }
    );
    const apiSchema = generateSchema(zodSchema);
    expect(apiSchema.properties).toBeDefined();
    expect((apiSchema.properties?.aNever as SchemaObject).readOnly).toEqual(
      true
    );
  });

  it('should support string and string constraints', () => {
    const zodSchema = extendApi(
      z
        .object({
          aStringMax: z.string().max(5),
          aStringMin: z.string().min(3),
          aStringLength: z.string().length(10),
          aStringEmail: z.string().email(),
          aStringUrl: z.string().url(),
          aStringUUID: z.string().uuid(),
          aStringRegex: z.string().regex(/^[a-zA-Z]+$/),
          aStringNonEmpty: z.string().nonempty(),
        })
        .partial(),
      {
        description: `This is totally unlike String Theory`,
      }
    );
    const apiSchema = generateSchema(zodSchema);
    expect(apiSchema).toEqual({
      type: 'object',
      properties: {
        aStringMax: { type: 'string', maxLength: 5 },
        aStringMin: { type: 'string', minLength: 3 },
        aStringLength: { type: 'string', minLength: 10, maxLength: 10 },
        aStringEmail: { type: 'string', format: 'email' },
        aStringUrl: { type: 'string', format: 'uri' },
        aStringUUID: { type: 'string', format: 'uuid' },
        aStringRegex: { type: 'string', regex: /^[a-zA-Z]+$/ },
        aStringNonEmpty: { type: 'string', minLength: 1 },
      },
      required: [],
      description: 'This is totally unlike String Theory',
    });
  });

  it('should support numbers and number constraints', () => {
    const zodSchema = extendApi(
      z
        .object({
          aNumberMin: z.number().min(3),
          aNumberMax: z.number().max(8),
          aNumberInt: z.number().int(),
          aNumberPositive: z.number().positive(),
          aNumberNonnegative: z.number().nonnegative(),
          aNumberNegative: z.number().negative(),
          aNumberNonpositive: z.number().nonpositive(),
        })
        .partial(),
      {
        description: `Look mah, the horse can count higher than me!`,
      }
    );
    const apiSchema = generateSchema(zodSchema);
    expect(apiSchema).toEqual({
      type: 'object',
      properties: {
        aNumberMin: { type: 'number', minimum: 3 },
        aNumberMax: { type: 'number', maximum: 8 },
        aNumberInt: { type: 'integer' },
        aNumberPositive: { type: 'number', minimum: 1 },
        aNumberNonnegative: { type: 'number', minimum: 0 },
        aNumberNegative: { type: 'number', maximum: -1 },
        aNumberNonpositive: { type: 'number', maximum: 0 },
      },
      required: [],
      description: 'Look mah, the horse can count higher than me!',
    });
  });

  it('should support records', () => {
    const zodSchema = extendApi(z.record(z.number().min(2).max(42)), {
      description: 'Record this one for me.',
    });
    const apiSchema = generateSchema(zodSchema);
    expect(apiSchema).toEqual({
      type: 'object',
      additionalProperties: { type: 'number', minimum: 2, maximum: 42 },
      description: 'Record this one for me.',
    });
  });

  it('Testing large mixed schema', () => {
    enum Fruits {
      Apple,
      Banana,
    }

    const MoreFruits = {
      Pear: 'pear',
      Plumb: 'plumb',
      grapes: 3,
    } as const;

    const zodSchema = z.object({
      name: extendApi(z.string(), { description: `User full name` }),
      email: extendApi(z.string().email().min(4), {
        description: 'User email',
      }),
      whatever: z.string().optional(),
      myCollection: extendApi(
        z.array(z.object({ name: z.string(), count: z.number() })),
        { maxItems: 10 }
      ),
      timeStamp: z.string().refine(validator.isISO8601),
      literals: z.object({
        wordOne: z.literal('One').nullable(),
        numberTwo: z.literal(2).optional(),
        isThisTheEnd: z.literal(false).optional().nullable(),
      }),
      foodTest: extendApi(
        z.object({
          fishEnum: extendApi(z.enum(['Salmon', 'Tuna', 'Trout']), {
            description: 'Choose your fish',
            default: 'Salmon',
          }),
          fruitEnum: z.nativeEnum(Fruits),
          moreFruitsEnum: z.nativeEnum(MoreFruits),
        }),
        { description: 'Have some lunch' }
      ),
      employedPerson: extendApi(
        z.intersection(
          z.object({ name: z.string() }),
          z.object({
            role: z.enum(['manager', 'employee', 'intern', 'hopeful']),
          })
        ),
        { description: 'Our latest addition' }
      ),
      makeAChoice: z.union([z.literal('One'), z.literal(2)]),
      openChoice: extendApi(z.union([z.string(), z.string()]), {
        description: 'Odd pattern here',
      }),
      aNullish: z.string().nullish(),
      stringLengthOutput: z.string().transform((val) => val.length),
    });

    const schemaTest = generateSchema(zodSchema, true);

    expect(schemaTest).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'User full name' },
        email: {
          type: 'string',
          format: 'email',
          minLength: 4,
          description: 'User email',
        },
        whatever: { type: 'string' },
        myCollection: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, count: { type: 'number' } },
            required: ['name', 'count'],
          },
          maxItems: 10,
        },
        timeStamp: { type: 'string' },
        literals: {
          type: 'object',
          properties: {
            wordOne: { nullable: true, type: 'string', enum: ['One'] },
            numberTwo: { type: 'number', enum: [2] },
            isThisTheEnd: { nullable: true, type: 'boolean', enum: [false] },
          },
          required: ['wordOne'],
        },
        foodTest: {
          type: 'object',
          properties: {
            fishEnum: {
              type: 'string',
              enum: ['Salmon', 'Tuna', 'Trout'],
              description: 'Choose your fish',
              default: 'Salmon',
            },
            fruitEnum: { type: 'string', enum: ['Apple', 'Banana', 0, 1] },
            moreFruitsEnum: { type: 'string', enum: ['pear', 'plumb', 3] },
          },
          required: ['fishEnum', 'fruitEnum', 'moreFruitsEnum'],
          description: 'Have some lunch',
        },
        employedPerson: {
          allOf: [
            {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
            {
              type: 'object',
              properties: {
                role: {
                  type: 'string',
                  enum: ['manager', 'employee', 'intern', 'hopeful'],
                },
              },
              required: ['role'],
            },
          ],
          description: 'Our latest addition',
        },
        makeAChoice: {
          oneOf: [
            { type: 'string', enum: ['One'] },
            { type: 'number', enum: [2] },
          ],
        },
        openChoice: {
          oneOf: [{ type: 'string' }, { type: 'string' }],
          description: 'Odd pattern here',
        },
        aNullish: { nullable: true, type: 'string' },
        stringLengthOutput: { type: 'number' },
      },
      required: [
        'name',
        'email',
        'myCollection',
        'timeStamp',
        'literals',
        'foodTest',
        'employedPerson',
        'makeAChoice',
        'openChoice',
        'stringLengthOutput',
      ],
    });

    // const builder = OpenApiBuilder.create();
    // builder.addSchema('Users', schemaTest);
    // builder;
  });

  it('Experimentation', () => {
    const UserZ = z.object({
      uid: extendApi(z.string().nonempty(), {
        description: 'A firebase generated UUID',
        format: 'firebase-uuid',
      }),
      theme: extendApi(z.enum([`light`, `dark`]), {
        description: 'Defaults to light theme',
        default: 'light',
      }),
      email: z.string().email().optional(),
      phoneNumber: z.string().min(10).optional(),
    });

    const openApiSchema: SchemaObject = generateSchema(UserZ);

    expect(openApiSchema.properties).toBeDefined();
  });

  it('Take any Zod schema and convert it to an OpenAPI JSON object', () => {
    const aZodSchema = z.object({
      uid: z.string().nonempty(),
      firstName: z.string().min(2),
      lastName: z.string().optional(),
      email: z.string().email(),
      phoneNumber: z.string().min(10).optional(),
    });

    const myOpenApiSchema = generateSchema(aZodSchema);

    expect(myOpenApiSchema).toEqual({
      type: 'object',
      properties: {
        uid: { type: 'string', minLength: 1 },
        firstName: { type: 'string', minLength: 2 },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phoneNumber: { type: 'string', minLength: 10 },
      },
      required: ['uid', 'firstName', 'email'],
    });
  });
  it('Extend a Zod schema with additional OpenAPI schema via a function wrapper', () => {
    const aZodExtendedSchema = extendApi(
      z.object({
        uid: extendApi(z.string().nonempty(), {
          title: 'Unique ID',
          description: 'A UUID generated by the server',
        }),
        firstName: z.string().min(2),
        lastName: z.string().optional(),
        email: z.string().email(),
        phoneNumber: extendApi(z.string().min(10), {
          description: 'US Phone numbers only',
          example: '555-555-5555',
        }),
      }),
      {
        title: 'User',
        description: 'A user schema',
      }
    );

    const myOpenApiSchema = generateSchema(aZodExtendedSchema);

    expect(myOpenApiSchema).toEqual({
      type: 'object',
      properties: {
        uid: {
          type: 'string',
          minLength: 1,
          title: 'Unique ID',
          description: 'A UUID generated by the server',
        },
        firstName: { type: 'string', minLength: 2 },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phoneNumber: {
          type: 'string',
          minLength: 10,
          description: 'US Phone numbers only',
          example: '555-555-5555',
        },
      },
      required: ['uid', 'firstName', 'email', 'phoneNumber'],
      title: 'User',
      description: 'A user schema',
    });
  });
});
