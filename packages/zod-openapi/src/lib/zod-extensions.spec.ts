import {extendZodWithOpenApi } from "./zod-extensions";
import {z} from "zod";
import { generateSchema } from './zod-openapi';


describe('Zod Extensions', () => {

  it('should generate a schema for a Zod object', () => {

    extendZodWithOpenApi(z, true)

    const schema = z.object({
      one: z.string().openapi({example: 'oneOne'}),
      two: z.number(),
    }).openapi({example: {one: 'oneOne', two: 42}})

    const apiSchema = generateSchema(schema);

    expect(apiSchema).toEqual({
      "example": {
        "one": "oneOne",
        "two": 42
      },
      "properties": {
        "one": {
          "example": "oneOne",
          "type": "string"
        },
        "two": {
          "type": "number"
        }
      },
      "required": [
        "one",
        "two"
      ],
      "type": "object"
    })
  })


})
