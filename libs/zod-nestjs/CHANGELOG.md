# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.0.1](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.0.0...zod-nestjs-1.0.1) (2022-07-14)



# 1.0.0 (2022-07-14)


### Bug Fixes

* Adding in new release githuib actions ([29a2455](https://github.com/anatine/zod-plugins/commit/29a2455161f7021df9f933d0d8b200a08fe31fde))
* Update to new code deps ([d771c4b](https://github.com/anatine/zod-plugins/commit/d771c4b2b026635a6704eeb1fca80dd2f2e5e8e8))


* zod-nestjs: Allow using the zodSchema field to construct other types ([150843d](https://github.com/anatine/zod-plugins/commit/150843dcdd783d3424323e861d199556826d36ea))


### BREAKING CHANGES

* The "T" in ZodDtoStatic<T> has changed from the output type to the
schema type. Code that is using the ZodDtoStatic type directly may need
to be updated. No changes are needed if just using the DTOs.

Examples:

// user.dto.ts

import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const schema = z.object({ name: z.string() });

export class UserDto extends createZodDto(schema) {}

// users-list.dto.ts (has an array of users)

import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { UserDto } from './user.dto';

// Previously produced a TypeScript error: Property 'array' does not exist on type 'CompatibleZodType'.
const schema = z.object({ items: UserDto.zodSchema.array() });

export class UsersListDto extends createZodDto(schema) {}

// extended-user.dto.ts (a user with an additional field)

import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { UserDto } from './user.dto';

// Previously produced a TypeScript error: Property 'extend' does not exist on type 'CompatibleZodType'.
const schema = UserDto.zodSchema.extend({ group: z.string() });

export class ExtendedUserDto extends createZodDto(schema) {}
