import { z } from 'zod';
import { generateMock } from './zod-mock';

describe('zod-mock', () => {
  it('should generate a mock object using faker', () => {
    const schema = z.object({
      uid: z.string().nonempty(),
      theme: z.enum([`light`, `dark`]),
      email: z.string().email().optional(),
      phoneNumber: z.string().min(10).optional(),
      stringArrays: z.array(z.string()),
      userEmails: z.array(z.string().email()),
      stringLength: z.string().transform((val) => val.length),
      numberCount: z.number().transform((item) => `total value = ${item}`),
      age: z.number().min(18).max(120),
    });

    const mockData = generateMock(schema); //?

    expect(typeof mockData.uid).toEqual('string');

    schema.shape.stringLength; //?
  });
});
