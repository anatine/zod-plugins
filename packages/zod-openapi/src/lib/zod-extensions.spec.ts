import {extendZodWithOpenApi } from "./zod-extensions";
import {z} from "zod";
import { generateSchema } from './zod-openapi';


describe('Zod Extensions', () => {

  it('should generate a schema for a Zod object', () => {

    extendZodWithOpenApi(z, true)

    const schema = z.object({
      one: z.string().openapi({examples: ['oneOne']}),
      two: z.number(),
      three: z.number().optional(),
    }).openapi({
      examples: [{one: 'oneOne', two: 42}],
      hideDefinitions: ['three']
    })

    const apiSchema = generateSchema(schema);

    expect(apiSchema).toEqual({
      "examples": [{
        "one": "oneOne",
        "two": 42
      }],
      "properties": {
        "one": {
          "examples": ["oneOne"],
          "type": ["string"]
        },
        "two": {
          "type": ["number"]
        }
      },
      "required": [
        "one",
        "two"
      ],
      "type": ["object"],
      "hideDefinitions": ["three"],
    })
  })


})
