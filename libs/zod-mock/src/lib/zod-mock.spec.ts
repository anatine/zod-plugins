import { Schema } from 'inspector';
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
  });

  it('should work here', () => {
    const UserZ = z.object({
      uid: z.string().uuid().nonempty(),
      firstName: z.string().nonempty(),
      lastName: z.string().nonempty(),
      email: z.string().email(),
      avatar: z.string().url().optional(),
      jobTitle: z.string().optional(),
    });

    const mock = generateMock(UserZ); //?
  });
});
