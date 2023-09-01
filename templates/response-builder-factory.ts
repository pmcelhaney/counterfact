// eslint-disable-next-line n/no-unpublished-import
import type { OpenApiResponse } from "../src/server/response-builder.js";

type OmitValueWhenNever<Base> = Pick<
  Base,
  {
    [Key in keyof Base]: [Base[Key]] extends [never] ? never : Key;
  }[keyof Base]
>;

type MediaType = `${string}/${string}`;

interface OpenApiResponses {
  [key: string]: OpenApiResponse;
}

type IfHasKey<SomeObject, Key, Yes, No> = Key extends keyof SomeObject
  ? Yes
  : No;

type MaybeShortcut<
  ContentType extends MediaType,
  Response extends OpenApiResponse,
> = IfHasKey<
  Response["content"],
  ContentType,
  (body: Response["content"][ContentType]["schema"]) => ResponseBuilder<{
    content: Omit<Response["content"], ContentType>;
    headers: Response["headers"];
  }>,
  never
>;

type MatchFunction<Response extends OpenApiResponse> = <
  ContentType extends MediaType & keyof Response["content"],
>(
  contentType: ContentType,
  body: Response["content"][ContentType]["schema"],
) => ResponseBuilder<{
  content: Omit<Response["content"], ContentType>;
  headers: Response["headers"];
}>;

type HeaderFunction<Response extends OpenApiResponse> = <
  Header extends string & keyof Response["headers"],
>(
  header: Header,
  value: Response["headers"][Header]["schema"],
) => ResponseBuilder<{
  content: Response["content"];
  headers: Omit<Response["headers"], Header>;
}>;

export type ResponseBuilder<
  Response extends OpenApiResponse = OpenApiResponse,
> = [keyof Response["content"]] extends [never]
  ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    void
  : OmitValueWhenNever<{
      header: [keyof Response["headers"]] extends [never]
        ? never
        : HeaderFunction<Response>;
      html: MaybeShortcut<"text/html", Response>;
      json: MaybeShortcut<"application/json", Response>;
      match: [keyof Response["content"]] extends [never]
        ? never
        : MatchFunction<Response>;
      random: [keyof Response["content"]] extends [never] ? never : () => void;
      text: MaybeShortcut<"text/plain", Response>;
    }>;

export type ResponseBuilderFactory<
  Responses extends OpenApiResponses = OpenApiResponses,
> = {
  [StatusCode in keyof Responses]: ResponseBuilder<Responses[StatusCode]>;
} & { [key: string]: ResponseBuilder<Responses["default"]> };

export type HttpStatusCode =
  | 100
  | 101
  | 102
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 226
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 307
  | 308
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 422
  | 423
  | 424
  | 426
  | 428
  | 429
  | 431
  | 451
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 511;
