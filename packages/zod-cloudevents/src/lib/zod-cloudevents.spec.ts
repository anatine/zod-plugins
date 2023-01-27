import { ZodCloudEvent } from './event/cloudevent';
import { z } from 'zod';
import {
  CloudEventV1Schema,
  propertyNameSuperRefiner,
} from './schema/cloudevent.schema';

describe('zodCloudevents', () => {
  const ZodUser = z.object({
    name: z.string(),
    age: z.number(),
  });
  it('should create a valid CloudEvent instance', () => {
    const MyCustomEvent = CloudEventV1Schema.extend({
      data: ZodUser,
    });

    const ce = new ZodCloudEvent(MyCustomEvent, {
      type: 'my.event.type',
      source: 'https://example.com',
      data: {
        name: 'John',
        age: 42,
      },
    });

    expect(ce.data).toEqual({
      name: 'John',
      age: 42,
    });
    expect(ce.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(ce.specversion).toEqual('1.0');
    expect(ce.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(ce.type).toEqual('my.event.type');
    expect(ce.source).toEqual('https://example.com');
    expect(JSON.parse(JSON.stringify(ce))).toEqual(ce.event);
    expect(JSON.parse(ce.toString())).toEqual(ce.event);
  });

  // it('Should refine bad key names', () => {
  //   const MyCustomEvent = CloudEventV1.extend({
  //     data: z.string(),
  //     otherValue: z.string(),
  //   });
  //   expect(() =>
  //     MyCustomEvent.superRefine(propertyNameSuperRefiner).parse({
  //       id: '123',
  //       type: 'my.event.type',
  //       specversion: '1.0',
  //       source: 'https://example.com',
  //       data: 'my data',
  //       otherValue: 'someValue',
  //     })
  //   ).toThrowError();
  // });
  // it('should create a cloud event', () => {
  //   const MyCustomEvent = CloudEventV1.extend({
  //     data: z.string(),
  //   });
  //   const ce = new ZodCloudEvent(MyCustomEvent, {
  //     // id: '123',
  //     type: 'my.event.type',
  //     // specversion: '1.0',
  //     source: 'https://example.com',
  //     data: 'my data',
  //   });
  //   expect(JSON.parse(JSON.stringify(ce))).toEqual(ce.event);
  //   expect(JSON.parse(ce.toString())).toEqual(ce.event);
  // });
});
