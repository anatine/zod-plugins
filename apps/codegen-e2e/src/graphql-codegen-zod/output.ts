import { z } from 'zod';



export const DateSchema = z.string();
export const EmailAddressSchema: z.ZodSchema<string> = z.string().email();
export const IPAddressSchema = z.string();
export const URLSchema = z.string();

export const ButtonComponentTypeSchema = z.enum(["BUTTON","SUBMIT"]);
export const EventOptionTypeSchema = z.enum(["RELOAD","RETRY"]);
export const HTTPMethodSchema = z.enum(["GET","POST"]);
export const PageTypeSchema = z.enum(["BASIC_AUTH","LP","RESTRICTED","SERVICE"]);
export const TestEnumSchema = z.enum(["ENUM1","ENUM2"]);

export const AttributeInputSchema = z.lazy(() => z.object({
key: z.string().nullish(),
val: z.string().nullish()
}));


export const ComponentInputSchema = z.lazy(() => z.object({
child: ComponentInputSchema.nullish(),
childrens: z.array(ComponentInputSchema.nullish()).nullish(),
event: EventInputSchema.nullish(),
name: z.string(),
type: ButtonComponentTypeSchema
}));


export const DropDownComponentInputSchema = z.lazy(() => z.object({
dropdownComponent: ComponentInputSchema.nullish(),
getEvent: EventInputSchema
}));


export const EventArgumentInputSchema = z.lazy(() => z.object({
name: z.string(),
value: z.string()
}));


export const EventInputSchema = z.lazy(() => z.object({
arguments: z.array(EventArgumentInputSchema),
options: z.array(EventOptionTypeSchema).nullish()
}));


export const HTTPInputSchema = z.lazy(() => z.object({
method: HTTPMethodSchema.nullish(),
url: URLSchema
}));


export const LayoutInputSchema = z.lazy(() => z.object({
dropdown: DropDownComponentInputSchema.nullish()
}));


export const PageInputSchema = z.lazy(() => z.object({
attributes: z.array(AttributeInputSchema).nullish(),
date: DateSchema.nullish(),
description: z.string().nullish(),
height: z.number(),
id: z.string(),
layout: LayoutInputSchema,
pageType: PageTypeSchema,
postIDs: z.array(z.string()).nullish(),
show: z.boolean(),
tags: z.array(z.string().nullish()).nullish(),
title: z.string(),
width: z.number()
}));


export const RegisterAddressInputSchema = z.lazy(() => z.object({
city: z.string(),
ipAddress: IPAddressSchema.nullish(),
line2: z.string().min(10).max(20).nullish(),
someBoolean: z.boolean().nullish(),
someNumber: z.number().min(10).max(20).nullish(),
someNumberFloat: z.number().min(10.5).max(20.5).nullish(),
state: z.array(z.string().nullish())
}));


export const TestExampleSchema = z.lazy(() => z.object({
email: z.string().nullish(),
id: z.string(),
name: z.string()
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