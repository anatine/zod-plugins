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
      avatar: z.string().url().optional(),
      jobTitle: z.string().optional(),
      otherUserEmails: z.array(z.string().email()),
      stringArrays: z.array(z.string()),
      stringLength: z.string().transform((val) => val.length),
      numberCount: z.number().transform((item) => `total value = ${item}`),
      age: z.number().min(18).max(120),
    });

    const mockData = generateMock(schema); //?

    expect(typeof mockData.uid).toEqual('string');
    expect(
      mockData.theme === 'light' || mockData.theme === 'dark'
    ).toBeTruthy();
    expect(mockData.email).toEqual(expect.stringMatching(/\S+@\S+\.\S+/));
    expect(mockData.avatar).toEqual(
      expect.stringMatching(
        /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i
      )
    );
    expect(typeof mockData.phoneNumber).toEqual('string');
    expect(typeof mockData.jobTitle).toEqual('string');
    expect(typeof mockData.stringLength).toEqual('number');
    expect(typeof mockData.numberCount).toEqual('string');
    expect(mockData.age > 18 && mockData.age < 120).toBeTruthy();

    console.log(JSON.stringify(mockData, null, 2));
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
