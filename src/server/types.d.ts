interface OpenApiHeader {
  schema: unknown;
}

interface OpenApiContent {
  schema: unknown;
}

interface Example {
  description: string;
  summary: string;
  value: unknown;
}

type MediaType = `${string}/${string}`;

type OmitValueWhenNever<Base> = Pick<
  Base,
  {
    [Key in keyof Base]: [Base[Key]] extends [never] ? never : Key;
  }[keyof Base]
>;

interface OpenApiResponse {
  content: { [key: MediaType]: OpenApiContent };
  headers: { [key: string]: OpenApiHeader };
}

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
  (body: Response["content"][ContentType]["schema"]) => GenericResponseBuilder<{
    content: NeverIfEmpty<Omit<Response["content"], ContentType>>;
    headers: Response["headers"];
  }>,
  never
>;

type NeverIfEmpty<Record> = {} extends Record ? never : Record;

type MatchFunction<Response extends OpenApiResponse> = <
  ContentType extends MediaType & keyof Response["content"],
>(
  contentType: ContentType,
  body: Response["content"][ContentType]["schema"]
) => GenericResponseBuilder<{
  content: NeverIfEmpty<Omit<Response["content"], ContentType>>;
  headers: Response["headers"];
}>;

type HeaderFunction<Response extends OpenApiResponse> = <
  Header extends string & keyof Response["headers"],
>(
  header: Header,
  value: Response["headers"][Header]["schema"]
) => GenericResponseBuilder<{
  content: NeverIfEmpty<Response["content"]>;
  headers: NeverIfEmpty<Omit<Response["headers"], Header>>;
}>;

type RandomFunction<Response extends OpenApiResponse> = <
  Header extends string & keyof Response["headers"],
>() => GenericResponseBuilder<OmitValueWhenNever<{
  content: never;
  headers: NeverIfEmpty<Response["headers"]>;
}>>;

interface ResponseBuilder {
  [status: number | `${number} ${string}`]: ResponseBuilder;
  content?: { body: unknown; type: string }[];
  header: (name: string, value: string) => ResponseBuilder;
  headers: { [name: string]: string };
  html: (body: unknown) => ResponseBuilder;
  json: (body: unknown) => ResponseBuilder;
  match: (contentType: string, body: unknown) => ResponseBuilder;
  random: () => ResponseBuilder;
  randomLegacy: () => ResponseBuilder;
  status?: number;
  text: (body: unknown) => ResponseBuilder;
  xml: (body: unknown) => ResponseBuilder;
}

type GenericResponseBuilderInner<
  Response extends OpenApiResponse = OpenApiResponse,
> = OmitValueWhenNever<{
  header: [keyof Response["headers"]] extends [never]
    ? never
    : HeaderFunction<Response>;
  html: MaybeShortcut<"text/html", Response>;
  json: MaybeShortcut<"application/json", Response>;
  match: [keyof Response["content"]] extends [never]
    ? never
    : MatchFunction<Response>;
  random: [keyof Response["content"]] extends [never]
    ? never
    : RandomFunction<Response>;
  text: MaybeShortcut<"text/plain", Response>;
  xml: MaybeShortcut<"application/xml" | "text/xml", Response>;
}>;

type GenericResponseBuilder<
  Response extends OpenApiResponse = OpenApiResponse,
> = {} extends OmitValueWhenNever<Response> ? "COUNTERFACT_RESPONSE" : GenericResponseBuilderInner<Response>;

type ResponseBuilderFactory<
  Responses extends OpenApiResponses = OpenApiResponses,
> = {
  [StatusCode in keyof Responses]: GenericResponseBuilder<
    Responses[StatusCode]
  >;
} & { [key: string]: GenericResponseBuilder<Responses["default"]> };

type HttpStatusCode =
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

interface OpenApiParameters {
  in: "body" | "cookie" | "formData" | "header" | "path" | "query";
  name: string;
  schema?: {
    type: string;
  };
}

interface OpenApiOperation {
  parameters?: OpenApiParameters[];
  produces?: string[];
  responses: {
    [status: string]: {
      content?: {
        [type: number | string]: {
          examples?: { [key: string]: Example };
          schema: { [key: string]: unknown };
        };
      };
      examples?: { [key: string]: unknown };
      schema?: { [key: string]: unknown };
    };
  };
}

type WideResponseBuilder  = {   
  header: (body: unknown) => WideResponseBuilder;
  html: (body: unknown) => WideResponseBuilder;
  json: (body: unknown) => WideResponseBuilder;
  match: (contentType: string, body: unknown) => WideResponseBuilder;
  random: () => WideResponseBuilder;
  text: (body: unknown) => WideResponseBuilder;
  xml: (body: unknown) => WideResponseBuilder;
}

type WideOperationArgument = {
  path: Record<string, string>;
  query: Record<string, string>;
  header: Record<string, string>;
  body: unknown;
  response: Record<number, WideResponseBuilder>;
  proxy: (url: string) => { proxyUrl: string };
  context: unknown
};

export type {
  HttpStatusCode,
  MediaType,
  OpenApiOperation,
  OpenApiParameters,
  OpenApiResponse,
  ResponseBuilder,
  ResponseBuilderFactory,
  WideOperationArgument,
  OmitValueWhenNever
};
