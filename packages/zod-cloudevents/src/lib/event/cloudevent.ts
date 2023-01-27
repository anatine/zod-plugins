import { v4 as uuidV4 } from 'uuid';
import { z } from 'zod';
import {
  CloudEventVersion,
  propertyNameSuperRefiner,
} from '../schema/cloudevent.schema';
import { base64AsBinary } from '../validation/validators';
import { CloudEventV1Schema } from './../schema/cloudevent.schema';
import { asBase64, isBinary } from './../validation/validators';

/**
 * A CloudEvent describes event data in common formats to provide
 * interoperability across services, platforms and systems.
 * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md
 */

type EventInputType = Omit<
  z.infer<typeof CloudEventV1Schema>,
  'id' | 'specversion'
> & {
  id?: string;
  specversion?: string;
};

export class ZodCloudEvent<T extends z.ZodType<EventInputType>> {
  schema: T;
  event = {} as z.output<typeof this.schema>;

  constructor(
    schema: T,
    event: Omit<z.output<typeof schema>, 'id' | 'specversion'> & {
      id?: string;
      specversion?: string;
    },
    strict = true,
    superRefine = true
  ) {
    this.schema = schema;

    // Stores base64 as binary in the data property.
    // Or stores binary as base64 in the data_base64 property.
    if (event.data_base64) {
      event.data = base64AsBinary(
        event.data_base64
      ) as unknown as z.output<T>['data'];
    } else if (event.data && isBinary(event.data)) {
      event.data_base64 = asBase64(event.data as unknown as Buffer);
    }
    // Store the event generating defaults.
    this.event = { ...ZodCloudEvent.generateDefaults(), ...event };
    // Validate the event.
    if (strict) {
      this.event = this.validate(this.event, superRefine);
    }
  }

  public static generateDefaults() {
    return {
      id: uuidV4(),
      specversion: CloudEventVersion.Enum['1.0'],
      time: new Date().toISOString(),
    };
  }

  public validate(data: z.input<typeof this.schema>, superRefine = true) {
    if (superRefine) {
      return this.schema.superRefine(propertyNameSuperRefiner).parse(data);
    } else {
      return this.schema.parse(data);
    }
  }

  /**
   * Used by JSON.stringify(). The name is confusing, but this method is called by
   * JSON.stringify() when converting this object to JSON.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
   * @return {object} this event as a plain object
   */
  toJSON(): Record<string, unknown> {
    const event = { ...this.event };
    event.time = new Date(this.event.time as string).toISOString();

    if (event.data_base64 && event.data) {
      delete event.data;
    }

    return event;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  get id(): string {
    return this.event.id || '';
  }
  get type(): string {
    return this.event.type;
  }
  get source(): string {
    return this.event.source;
  }
  get specversion(): CloudEventVersion {
    return this.event.specversion as CloudEventVersion;
  }
  get datacontenttype(): string | null | undefined {
    return this.event.datacontenttype;
  }
  get dataschema(): string | null | undefined {
    return this.event.dataschema;
  }
  get subject(): string | null | undefined {
    return this.event.subject;
  }
  get time(): string {
    return this.event.time as string;
  }
  get data(): z.output<typeof this.schema>['data'] {
    return this.event.data;
  }
  get data_base64(): string | null | undefined {
    return this.event.data_base64;
  }

  /**
   * The native `console.log` value of the CloudEvent.
   * @return {string} The string representation of the CloudEvent.
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }
}
