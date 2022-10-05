# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.8.0](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.4...zod-nestjs-1.8.0) (2022-10-05)


### Features

* Support for @Param() in @anatine/zod-nestjs ([ba00144](https://github.com/anatine/zod-plugins/commit/ba001444d3554695fe6db6b0d449f03351d65c48))

## [1.8.0](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.4...zod-nestjs-1.8.0) (2022-10-05)


### Features

* Support for @Param() in @anatine/zod-nestjs ([ba00144](https://github.com/anatine/zod-plugins/commit/ba001444d3554695fe6db6b0d449f03351d65c48))

### [1.8.1](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.8.0...zod-nestjs-1.8.1) (2022-10-05)

## [1.8.0](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.4...zod-nestjs-1.8.0) (2022-10-05)


### Features

* Support for @Param() in @anatine/zod-nestjs ([ba00144](https://github.com/anatine/zod-plugins/commit/ba001444d3554695fe6db6b0d449f03351d65c48))

### [1.7.4](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.3...zod-nestjs-1.7.4) (2022-08-16)

### [1.7.4](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.2...zod-nestjs-1.7.3) (2022-07-26)

Remove tslib dep

### [1.7.3](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.2...zod-nestjs-1.7.3) (2022-07-26)

### Bug Fixes

* missing readme ([581e371](https://github.com/anatine/zod-plugins/commit/581e37112c223782759635ae34937a0dfa664dc9))
* more readme fixes ([ed36d93](https://github.com/anatine/zod-plugins/commit/ed36d935dc6bb93ab35b5212e966130ff3ba9838))

## [1.7.2](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.1...zod-nestjs-1.7.2) (2022-07-24)

### Bug Fixes

* Missing README after refactor ([00ceb10](https://github.com/anatine/zod-plugins/commit/00ceb10be8251c6be2a83e64a9a8cd6116451938))

## [1.7.1](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.7.0...zod-nestjs-1.7.1) (2022-07-24)

# [1.7.0](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.6.0...zod-nestjs-1.7.0) (2022-07-24)

### Bug Fixes

* release pipeline ([bb0ad83](https://github.com/anatine/zod-plugins/commit/bb0ad836a954659b778f1181dff4fe99daf35447)), closes [PR#46](https://github.com/PR/issues/46)

# [1.6.0](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.5.0...zod-nestjs-1.6.0) (2022-07-24)

### Bug Fixes

* remove implicitDependencies ([970f924](https://github.com/anatine/zod-plugins/commit/970f924a044d907007482c14a05c710c02a04032))

# [1.5.0](https://github.com/anatine/zod-plugins/compare/zod-nestjs-1.4.1...zod-nestjs-1.5.0) (2022-07-14)

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
