import { z } from 'zod';

export const CloudEventVersion = z.enum(['1.0', '0.3']);
export type CloudEventVersion = z.infer<typeof CloudEventVersion>;

export const CloudEventV1Schema = z.object({
  // REQUIRED Attributes
  /**
   * [REQUIRED] Identifies the event. Producers MUST ensure that `source` + `id`
   * is unique for each distinct event. If a duplicate event is re-sent (e.g. due
   * to a network error) it MAY have the same `id`. Consumers MAY assume that
   * Events with identical `source` and `id` are duplicates.
   * @required Non-empty string. Unique within producer.
   * @example An event counter maintained by the producer
   * @example A UUID
   */
  id: z.string().min(1).describe('Identifies the event.'),

  /**
   * [REQUIRED] The version of the CloudEvents specification which the event
   * uses. This enables the interpretation of the context. Compliant event
   * producers MUST use a value of `1.0` when referring to this version of the
   * specification.
   * @required MUST be a non-empty string.
   */
  specversion: z
    .string()
    .min(1)
    .describe(
      'The version of the CloudEvents specification which the event uses.'
    ),

  /**
   * [REQUIRED] Identifies the context in which an event happened. Often this
   * will include information such as the type of the event source, the
   * organization publishing the event or the process that produced the event. The
   * exact syntax and semantics behind the data encoded in the URI is defined by
   * the event producer.
   * Producers MUST ensure that `source` + `id` is unique for each distinct event.
   * An application MAY assign a unique `source` to each distinct producer, which
   * makes it easy to produce unique IDs since no other producer will have the same
   * source. The application MAY use UUIDs, URNs, DNS authorities or an
   * application-specific scheme to create unique `source` identifiers.
   * A source MAY include more than one producer. In that case the producers MUST
   * collaborate to ensure that `source` + `id` is unique for each distinct event.
   * @required Non-empty URI-reference
   */
  source: z
    .string()
    .min(1)
    .describe('Identifies the context in which an event happened.'),

  /**
   * [REQUIRED] This attribute contains a value describing the type of event
   * related to the originating occurrence. Often this attribute is used for
   * routing, observability, policy enforcement, etc. The format of this is
   * producer defined and might include information such as the version of the
   * `type` - see
   * [Versioning of Attributes in the Primer](primer.md#versioning-of-attributes)
   * for more information.
   * @required MUST be a non-empty string
   * @should SHOULD be prefixed with a reverse-DNS name. The prefixed domain dictates the
   *   organization which defines the semantics of this event type.
   * @example com.github.pull.create
   * @example com.example.object.delete.v2
   */
  type: z
    .string()
    .min(1)
    .describe(
      'Describes the type of event related to the originating occurrence.'
    ),

  /**
   * The following fields are optional.
   */

  /**
   * [OPTIONAL] Content type of `data` value. This attribute enables `data` to
   * carry any type of content, whereby format and encoding might differ from that
   * of the chosen event format. For example, an event rendered using the
   * [JSON envelope](./json-format.md#3-envelope) format might carry an XML payload
   * in `data`, and the consumer is informed by this attribute being set to
   * "application/xml". The rules for how `data` content is rendered for different
   * `datacontenttype` values are defined in the event format specifications; for
   * example, the JSON event format defines the relationship in
   * [section 3.1](./json-format.md#31-handling-of-data).
   */
  datacontenttype: z
    .union([
      z
        .string()
        .min(1)
        .describe(
          'Content type of the data value. Must adhere to RFC 2046 format.'
        ),
      z
        .null()
        .describe(
          'Content type of the data value. Must adhere to RFC 2046 format.'
        ),
    ])
    .describe('Content type of the data value. Must adhere to RFC 2046 format.')
    .optional(),

  /**
   * [OPTIONAL] Identifies the schema that `data` adheres to. Incompatible
   * changes to the schema SHOULD be reflected by a different URI. See
   * [Versioning of Attributes in the Primer](primer.md#versioning-of-attributes)
   * for more information.
   * If present, MUST be a non-empty URI.
   */
  dataschema: z
    .union([
      z
        .string()
        .url()
        .min(1)
        .describe('Identifies the schema that data adheres to.'),
      z.null().describe('Identifies the schema that data adheres to.'),
    ])
    .describe('Identifies the schema that data adheres to.')
    .optional(),

  /**
   * [OPTIONAL] This describes the subject of the event in the context of the
   * event producer (identified by `source`). In publish-subscribe scenarios, a
   * subscriber will typically subscribe to events emitted by a `source`, but the
   * `source` identifier alone might not be sufficient as a qualifier for any
   * specific event if the `source` context has internal sub-structure.
   *
   * Identifying the subject of the event in context metadata (opposed to only in
   * the `data` payload) is particularly helpful in generic subscription filtering
   * scenarios where middleware is unable to interpret the `data` content. In the
   * above example, the subscriber might only be interested in blobs with names
   * ending with '.jpg' or '.jpeg' and the `subject` attribute allows for
   * constructing a simple and efficient string-suffix filter for that subset of
   * events.
   *
   * If present, MUST be a non-empty string.
   * @example "https://example.com/storage/tenant/container"
   * @example "mynewfile.jpg"
   */
  subject: z
    .union([
      z
        .string()
        .min(1)
        .describe(
          'Describes the subject of the event in the context of the event producer (identified by source).'
        ),
      z
        .null()
        .describe(
          'Describes the subject of the event in the context of the event producer (identified by source).'
        ),
    ])
    .describe(
      'Describes the subject of the event in the context of the event producer (identified by source).'
    )
    .optional(),

  /**
   * [OPTIONAL] Timestamp of when the occurrence happened. If the time of the
   * occurrence cannot be determined then this attribute MAY be set to some other
   * time (such as the current time) by the CloudEvents producer, however all
   * producers for the same `source` MUST be consistent in this respect. In other
   * words, either they all use the actual time of the occurrence or they all use
   * the same algorithm to determine the value used.
   * @example "2020-08-08T14:48:09.769Z"
   */
  time: z
    .union([
      z
        .string()
        .datetime()
        .describe(
          'Timestamp of when the occurrence happened. Must adhere to RFC 3339.'
        ),
      z
        .null()
        .describe(
          'Timestamp of when the occurrence happened. Must adhere to RFC 3339.'
        ),
    ])
    .describe(
      'Timestamp of when the occurrence happened. Must adhere to RFC 3339.'
    )
    .optional(),

  /**
   * [OPTIONAL] The event payload. This specification does not place any restriction
   * on the type of this information. It is encoded into a media format which is
   * specified by the datacontenttype attribute (e.g. application/json), and adheres
   * to the dataschema format when those respective attributes are present.
   */
  data: z
    .union([
      z.record(z.any()).describe('The event payload as JSON.'),
      z.string().describe('The event payload as string.'),
      z.number().describe('The event payload as number.'),
      z.array(z.any()).describe('The event payload as array.'),
      z.boolean().describe('The event payload as boolean.'),
      z.null().describe('The event payload as null.'),
    ])
    .describe('The event payload.')
    .optional(),

  /**
   * [OPTIONAL] The event payload encoded as base64 data. This is used when the
   * data is in binary form.
   * @see https://github.com/cloudevents/spec/blob/v1.0/json-format.md#31-handling-of-data
   */
  data_base64: z
    .union([
      z
        .string()
        .describe('Base64 encoded event payload. Must adhere to RFC4648.'),
      z
        .null()
        .describe('Base64 encoded event payload. Must adhere to RFC4648.'),
    ])
    .describe('Base64 encoded event payload. Must adhere to RFC4648.')
    .optional(),
});
export type CloudEventV1Schema = z.infer<typeof CloudEventV1Schema>;

/**
 * To create a specific cloud event, you can use the `CloudEventV1` type.
 * @example
 * const User = z.object({
 *  uid: z.string().describe('The id of the user.'),
 *  fullName: z.string().describe('The name of the user.'),
 *  email: z.string().describe('The email of the user.'),
 * });
 *
 * const MyCloudEventSchema = CloudEventV1Schema.extend({
 *  type: z.literal('my.event.type').describe('The type of the event.'),
 *  source: z.literal('my.event.source').describe('The source of the event.'),
 *  customAttribute: z.string().describe('A custom attribute.'),
 *  data: User.describe('The data of the event as USER data.'),
 * })
 *
 */

export const propertyNameSuperRefiner = (
  val: Record<string, unknown>,
  ctx: z.RefinementCtx
) => {
  console.log('val', val);
  const badKey = Object.keys(val).find((key) => {
    console.log('key', key);
    return !key.match(/^[a-z0-9]{1,20}$/);
  });
  if (badKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [badKey],
      message: `Key name '${badKey}' must be a string between 1 and 20 characters long and only contain lowercase letters and numbers.`,
    });
  }
};
