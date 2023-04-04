import { z } from 'zod';
import {
  AttributeInput,
  ButtonComponentType,
  ComponentInput,
  DropDownComponentInput,
  EventArgumentInput,
  EventInput,
  EventOptionType,
  HttpInput,
  HttpMethod,
  LayoutInput,
  PageInput,
  PageType,
  RegisterAddressInput,
  TestEnum,
  TestExample,
  TestInput,
} from '../types';

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v));

export function AttributeInputSchema(): z.ZodObject<
  Properties<AttributeInput>
> {
  return z.object({
    key: z.string().nullish(),
    val: z.string().nullish(),
  });
}

export const ButtonComponentTypeSchema = z.nativeEnum(ButtonComponentType);

export function ComponentInputSchema(): z.ZodObject<
  Properties<ComponentInput>
> {
  return z.object({
    child: z.lazy(() => ComponentInputSchema().nullish()),
    childrens: z
      .array(z.lazy(() => ComponentInputSchema().nullable()))
      .nullish(),
    event: z.lazy(() => EventInputSchema().nullish()),
    name: z.string(),
    type: ButtonComponentTypeSchema,
  });
}

export function DropDownComponentInputSchema(): z.ZodObject<
  Properties<DropDownComponentInput>
> {
  return z.object({
    dropdownComponent: z.lazy(() => ComponentInputSchema().nullish()),
    getEvent: z.lazy(() => EventInputSchema()),
  });
}

export function EventArgumentInputSchema(): z.ZodObject<
  Properties<EventArgumentInput>
> {
  return z.object({
    name: z.string(),
    value: z.string(),
  });
}

export function EventInputSchema(): z.ZodObject<Properties<EventInput>> {
  return z.object({
    arguments: z.array(z.lazy(() => EventArgumentInputSchema())),
    options: z.array(EventOptionTypeSchema).nullish(),
  });
}

export const EventOptionTypeSchema = z.nativeEnum(EventOptionType);

export function HttpInputSchema(): z.ZodObject<Properties<HttpInput>> {
  return z.object({
    method: HttpMethodSchema.nullish(),
    url: z.string(),
  });
}

export const HttpMethodSchema = z.nativeEnum(HttpMethod);

export function LayoutInputSchema(): z.ZodObject<Properties<LayoutInput>> {
  return z.object({
    dropdown: z.lazy(() => DropDownComponentInputSchema().nullish()),
  });
}

export function PageInputSchema(): z.ZodObject<Properties<PageInput>> {
  return z.object({
    attributes: z.array(z.lazy(() => AttributeInputSchema())).nullish(),
    date: z.string().nullish(),
    description: z.string().nullish(),
    height: z.number(),
    id: z.string(),
    layout: z.lazy(() => LayoutInputSchema()),
    pageType: PageTypeSchema,
    postIDs: z.array(z.string()).nullish(),
    show: z.boolean(),
    tags: z.array(z.string().nullable()).nullish(),
    title: z.string(),
    width: z.number(),
  });
}

export const PageTypeSchema = z.nativeEnum(PageType);

export function RegisterAddressInputSchema(): z.ZodObject<
  Properties<RegisterAddressInput>
> {
  return z.object({
    city: z.string(),
    ipAddress: z.string().nullish(),
    line2: z.string().nullish(),
    someBoolean: z.boolean().nullish(),
    someNumber: z.number().nullish(),
    someNumberFloat: z.number().nullish(),
    state: z.array(z.string().nullable()),
  });
}

export const TestEnumSchema = z.nativeEnum(TestEnum);

export function TestExampleSchema(): z.ZodObject<Properties<TestExample>> {
  return z.object({
    __typename: z.literal('TestExample').optional(),
    email: z.string().nullish(),
    id: z.string(),
    name: z.string(),
  });
}

export function TestInputSchema(): z.ZodObject<Properties<TestInput>> {
  return z.object({
    emailArray: z.array(z.string().email().nullable()).nullish(),
    emailArrayRequired: z.array(z.string().email().nullable()),
    emailRequiredArray: z.array(z.string().email()).nullish(),
    emailRequiredArrayRequired: z.array(z.string().email()),
    enum: TestEnumSchema.nullish(),
    enumArray: z.array(TestEnumSchema.nullable()).nullish(),
    enumArrayRequired: z.array(TestEnumSchema.nullable()),
    enumRequired: TestEnumSchema,
    scalar: z.string().email().nullish(),
    scalarRequired: z.string().email(),
    string: z.string().nullish(),
    stringArray: z.array(z.string().nullable()).nullish(),
    stringArrayRequired: z.array(z.string().nullable()),
    stringRequired: z.string(),
    stringRequiredArray: z.array(z.string()).nullish(),
    stringRequiredArrayRequired: z.array(z.string()),
  });
}
