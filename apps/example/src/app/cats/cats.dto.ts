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
