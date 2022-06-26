import { z } from 'zod';



export const EmailAddressSchema: z.ZodSchema<string> = z.string().email();
export const IPAddressSchema = z.string();

export const TestEnumSchema = z.enum(["ENUM1","ENUM2"]);

export const RegisterAddressInputSchema = z.lazy(() => z.object({
city: z.string(),
ipAddress: IPAddressSchema.nullish(),
line2: z.string().min(10).max(20).nullish(),
postalCode: TestInputSchema,
someBoolean: z.boolean().nullish(),
someNumber: z.number().min(10).max(20).nullish(),
someNumberFloat: z.number().min(10.5).max(20.5).nullish(),
state: z.array(z.string().nullish())
}));


export const TestInputSchema = z.lazy(() => z.object({
emailArray: z.array(EmailAddressSchema.nullish()).nullish(),
emailArrayRequired: z.array(EmailAddressSchema.nullish()),
emailRequiredArray: z.array(EmailAddressSchema).nullish(),
emailRequiredArrayRequired: z.array(EmailAddressSchema),
enum: TestEnumSchema.nullish(),
enumArray: z.array(TestEnumSchema.nullish()).nullish(),
enumArrayRequired: z.array(TestEnumSchema.nullish()),
enumRequired: TestEnumSchema,
scalar: EmailAddressSchema.nullish(),
scalarRequired: EmailAddressSchema,
string: z.string().nullish(),
stringArray: z.array(z.string().nullish()).nullish(),
stringArrayRequired: z.array(z.string().nullish()),
stringRequired: z.string(),
stringRequiredArray: z.array(z.string()).nullish(),
stringRequiredArrayRequired: z.array(z.string())
}))