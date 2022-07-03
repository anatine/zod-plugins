export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  EmailAddress: any;
  IPAddress: any;
  URL: any;
};

export type AttributeInput = {
  key?: InputMaybe<Scalars['String']>;
  val?: InputMaybe<Scalars['String']>;
};

export enum ButtonComponentType {
  Button = 'BUTTON',
  Submit = 'SUBMIT'
}

export type ComponentInput = {
  child?: InputMaybe<ComponentInput>;
  childrens?: InputMaybe<Array<InputMaybe<ComponentInput>>>;
  event?: InputMaybe<EventInput>;
  name: Scalars['String'];
  type: ButtonComponentType;
};

export type DropDownComponentInput = {
  dropdownComponent?: InputMaybe<ComponentInput>;
  getEvent: EventInput;
};

export type EventArgumentInput = {
  name: Scalars['String'];
  value: Scalars['String'];
};

export type EventInput = {
  arguments: Array<EventArgumentInput>;
  options?: InputMaybe<Array<EventOptionType>>;
};

export enum EventOptionType {
  Reload = 'RELOAD',
  Retry = 'RETRY'
}

export type HttpInput = {
  method?: InputMaybe<HttpMethod>;
  url: Scalars['URL'];
};

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST'
}

export type LayoutInput = {
  dropdown?: InputMaybe<DropDownComponentInput>;
};

export type PageInput = {
  attributes?: InputMaybe<Array<AttributeInput>>;
  date?: InputMaybe<Scalars['Date']>;
  description?: InputMaybe<Scalars['String']>;
  height: Scalars['Float'];
  id: Scalars['ID'];
  layout: LayoutInput;
  pageType: PageType;
  postIDs?: InputMaybe<Array<Scalars['ID']>>;
  show: Scalars['Boolean'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title: Scalars['String'];
  width: Scalars['Int'];
};

export enum PageType {
  BasicAuth = 'BASIC_AUTH',
  Lp = 'LP',
  Restricted = 'RESTRICTED',
  Service = 'SERVICE'
}

export type RegisterAddressInput = {
  city: Scalars['String'];
  ipAddress?: InputMaybe<Scalars['IPAddress']>;
  line2?: InputMaybe<Scalars['String']>;
  someBoolean?: InputMaybe<Scalars['Boolean']>;
  someNumber?: InputMaybe<Scalars['Int']>;
  someNumberFloat?: InputMaybe<Scalars['Float']>;
  state: Array<InputMaybe<Scalars['String']>>;
};

export enum TestEnum {
  Enum1 = 'ENUM1',
  Enum2 = 'ENUM2'
}

export type TestExample = {
  __typename?: 'TestExample';
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type TestInput = {
  emailArray?: InputMaybe<Array<InputMaybe<Scalars['EmailAddress']>>>;
  emailArrayRequired: Array<InputMaybe<Scalars['EmailAddress']>>;
  emailRequiredArray?: InputMaybe<Array<Scalars['EmailAddress']>>;
  emailRequiredArrayRequired: Array<Scalars['EmailAddress']>;
  enum?: InputMaybe<TestEnum>;
  enumArray?: InputMaybe<Array<InputMaybe<TestEnum>>>;
  enumArrayRequired: Array<InputMaybe<TestEnum>>;
  enumRequired: TestEnum;
  scalar?: InputMaybe<Scalars['EmailAddress']>;
  scalarRequired: Scalars['EmailAddress'];
  string?: InputMaybe<Scalars['String']>;
  stringArray?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  stringArrayRequired: Array<InputMaybe<Scalars['String']>>;
  stringRequired: Scalars['String'];
  stringRequiredArray?: InputMaybe<Array<Scalars['String']>>;
  stringRequiredArrayRequired: Array<Scalars['String']>;
};
