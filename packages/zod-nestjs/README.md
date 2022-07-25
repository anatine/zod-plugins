# @anatine/zod-nestjs

Helper methods for using [Zod](https://github.com/colinhacks/zod) in a NestJS project.

- Validation pipe on data
- Patch to Swagger module

----

## Installation

Both openapi3-ts and zod are peer dependencies instead of dependant packages.
While `zod` is necessary for operation, `openapi3-ts` is for type-casting.

```shell
npm install openapi3-ts zod @anatine/zod-nestjs
```

----

## Usage

### Generate a schema

Use [Zod](https://github.com/colinhacks/zod) to generate a schema.
Additionally, use [@anatidae/zod-openapi](https://github.com/anatine/zod-plugins/tree/main/libs/zod-openapi) to extend a schema for OpenAPI and Swagger UI.

Example schema:

```typescript
import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
export const CatZ = extendApi(
  z.object({
    name: z.string(),
    age: z.number(),
    breed: z.string(),
  }),
  {
    title: 'Cat',
    description: 'A cat',
  }
);
export class CatDto extends createZodDto(CatZ) {}
export class UpdateCatDto extends createZodDto(CatZ.omit({ name: true })) {}
export const GetCatsZ = extendApi(
  z.object({
    cats: extendApi(z.array(z.string()), { description: 'List of cats' }),
  }),
  { title: 'Get Cat Response' }
);
export class GetCatsDto extends createZodDto(GetCatsZ) {}
export const CreateCatResponseZ = z.object({
  success: z.boolean(),
  message: z.string(),
  name: z.string(),
});
export class CreateCatResponseDto extends createZodDto(CreateCatResponseZ) {}
export class UpdateCatResponseDto extends createZodDto(
  CreateCatResponseZ.omit({ name: true })
) {}
```

### Use the schema in your controller

This follows the standard NestJS method of creating controllers.

`@nestjs/swagger` decorators should work normally.

Example Controller

```typescript
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import {
  CatDto,
  CreateCatResponseDto,
  GetCatsDto,
  UpdateCatDto,
  UpdateCatResponseDto,
} from './cats.dto';
@Controller('cats')
@UsePipes(ZodValidationPipe)
export class CatsController {
  @Get()
  @ApiCreatedResponse({
    type: GetCatsDto,
  })
  async findAll(): Promise<GetCatsDto> {
    return { cats: ['Lizzie', 'Spike'] };
  }
  @Get(':id')
  @ApiCreatedResponse({
    type: CatDto,
  })
  async findOne(@Param() { id }: { id: string }): Promise<CatDto> {
    return {
      name: `Cat-${id}`,
      age: 8,
      breed: 'Unknown',
    };
  }
  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: CreateCatResponseDto,
  })
  async create(@Body() createCatDto: CatDto): Promise<CreateCatResponseDto> {
    return {
      success: true,
      message: 'Cat created',
      name: createCatDto.name,
    };
  }
  @Patch()
  async update(
    @Body() updateCatDto: UpdateCatDto
  ): Promise<UpdateCatResponseDto> {
    return {
      success: true,
      message: `Cat's age of ${updateCatDto.age} updated`,
    };
  }
}
```

NOTE: Responses have to use the `ApiCreatedResponse` decorator when using the `@nestjs/swagger` module.

### Set up your app

Patch the swagger so that it can use Zod types before you create the document.

Example Main App

```typescript
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CatsModule } from './app/cats.module';
import { patchNestjsSwagger } from '@anatine/zod-nestjs';
async function bootstrap() {
  const app = await NestFactory.create(CatsModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  patchNestjsSwagger(); // <--- This is the hacky patch using prototypes (for now)
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const port = process.env.PORT || 3333;
  await app.listen(port, () => {
    Logger.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
}
bootstrap();
```

## Future goals

- Remove dependency on `@nestjs/swagger` by providing a Swagger UI.
- Expand to create an express-only wrapper (without NestJS)
- Auto generate client side libs with Zod validation.

## Credits

- ### [zod-dto](https://github.com/kbkk/abitia/tree/master/packages/zod-dto)

  Extensive use and inspiration from zod-dto.
  