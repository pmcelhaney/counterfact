import { OpenApiHeader } from "./OpenApiHeader";

interface OpenApiContent {
  schema: unknown;
}

interface Example {
  description: string;
  summary: string;
  value: unknown;
}

interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "none" | "strict";
  secure?: boolean;
}

const counterfactResponse = Symbol("Counterfact Response");

type COUNTERFACT_RESPONSE = {
  [counterfactResponse]: typeof counterfactResponse;
};

type MediaType = `${string}/${string}`;

type MaybePromise<T> = T | Promise<T>;

type OmitAll<T, K extends readonly string[]> = {
  [P in keyof T as P extends `${string}${K[number]}${string}`
    ? never
    : P]: T[P];
};

type OmitValueWhenNever<Base> = Pick<
  Base,
  {
    [Key in keyof Base]: [Base[Key]] extends [never] ? never : Key;
  }[keyof Base]
>;

interface OpenApiResponse {
  content: { [key: MediaType]: OpenApiContent };
  examples?: { [key: string]: unknown };
  headers: { [key: string]: { schema: unknown } };
  requiredHeaders: string;
}

interface OpenApiResponses {
  [key: string]: OpenApiResponse;
}

type IfHasKey<
  SomeObject,
  Keys extends readonly string[],
  Yes,
  No,
> = Keys extends [
  infer FirstKey extends string,
  ...infer RestKeys extends string[],
]
  ? Extract<keyof SomeObject, `${string}${FirstKey}${string}`> extends never
    ? IfHasKey<SomeObject, RestKeys, Yes, No>
    : Yes
  : No;

type SchemasOf<T extends { [key: string]: { schema: unknown } }> = {
  [K in keyof T]: T[K]["schema"];
}[keyof T];

type MaybeShortcut<
  ContentTypes extends MediaType[],
  Response extends OpenApiResponse,
> = IfHasKey<
  Response["content"],
  ContentTypes,
  (body: SchemasOf<Response["content"]>) => GenericResponseBuilder<{
    content: NeverIfEmpty<OmitAll<Response["content"], ContentTypes>>;
    headers: Response["headers"];
    requiredHeaders: Response["requiredHeaders"];
  }>,
  never
>;

type NeverIfEmpty<Record> = object extends Record ? never : Record;

type MatchFunction<Response extends OpenApiResponse> = <
  ContentType extends MediaType & keyof Response["content"],
>(
  contentType: ContentType,
  body: Response["content"][ContentType]["schema"],
) => GenericResponseBuilder<{
  content: NeverIfEmpty<Omit<Response["content"], ContentType>>;
  headers: Response["headers"];
  requiredHeaders: Response["requiredHeaders"];
}>;

type HeaderFunction<Response extends OpenApiResponse> = <
  Header extends string & keyof Response["headers"],
>(
  header: Header,
  value: Response["headers"][Header]["schema"],
) => GenericResponseBuilder<{
  content: NeverIfEmpty<Response["content"]>;
  headers: NeverIfEmpty<Omit<Response["headers"], Header>>;
  requiredHeaders: Exclude<Response["requiredHeaders"], Header>;
}>;

type RandomFunction = () => COUNTERFACT_RESPONSE;

type ExampleNames<Response extends OpenApiResponse> = Response extends {
  examples: infer E;
}
  ? keyof E & string
  : never;

interface ResponseBuilder {
  [status: number | `${number} ${string}`]: ResponseBuilder;
  binary: (body: Uint8Array | string) => ResponseBuilder;
  content?: { body: unknown; type: string }[];
  cookie: (
    name: string,
    value: string,
    options?: CookieOptions,
  ) => ResponseBuilder;
  example: (name: string) => ResponseBuilder;
  header: (name: string, value: string) => ResponseBuilder;
  headers: { [name: string]: string | string[] };
  html: (body: unknown) => ResponseBuilder;
  json: (body: unknown) => ResponseBuilder;
  match: (contentType: string, body: unknown) => ResponseBuilder;
  random: () => ResponseBuilder;
  randomLegacy: () => ResponseBuilder;
  status?: number;
  text: (body: unknown) => ResponseBuilder;
  xml: (body: unknown) => ResponseBuilder;
}

export type GenericResponseBuilderInner<
  Response extends OpenApiResponse = OpenApiResponse,
> = OmitValueWhenNever<{
  binary: MaybeShortcut<["application/octet-stream"], Response>;
  cookie: (
    name: string,
    value: string,
    options?: CookieOptions,
  ) => GenericResponseBuilder<Response>;
  header: [keyof Response["headers"]] extends [never]
    ? never
    : HeaderFunction<Response>;
  html: MaybeShortcut<["text/html"], Response>;
  json: MaybeShortcut<
    [
      "application/json",
      "text/json",
      "text/x-json",
      "application/xml",
      "text/xml",
    ],
    Response
  >;
  match: [keyof Response["content"]] extends [never]
    ? never
    : MatchFunction<Response>;
  random: [keyof Response["content"]] extends [never] ? never : RandomFunction;
  example: [ExampleNames<Response>] extends [never]
    ? never
    : (name: ExampleNames<Response>) => COUNTERFACT_RESPONSE;
  text: MaybeShortcut<["text/plain"], Response>;
  xml: MaybeShortcut<["application/xml", "text/xml"], Response>;
}>;

type GenericResponseBuilder<
  Response extends OpenApiResponse = OpenApiResponse,
> =
  object extends OmitValueWhenNever<Response>
    ? COUNTERFACT_RESPONSE
    : keyof OmitValueWhenNever<Response> extends "headers"
      ? {
          ALL_REMAINING_HEADERS_ARE_OPTIONAL: COUNTERFACT_RESPONSE;
          header: HeaderFunction<Response>;
        }
      : GenericResponseBuilderInner<Response>;

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
  type?: "string" | "number" | "integer" | "boolean";
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
      headers?: {
        [name: string]: OpenApiHeader;
      };
      schema?: { [key: string]: unknown };
    };
  };
}

interface WideResponseBuilder {
  binary: (body: Uint8Array | string) => WideResponseBuilder;
  example: (name: string) => WideResponseBuilder;
  cookie: (
    name: string,
    value: string,
    options?: CookieOptions,
  ) => WideResponseBuilder;
  header: (body: unknown) => WideResponseBuilder;
  html: (body: unknown) => WideResponseBuilder;
  json: (body: unknown) => WideResponseBuilder;
  match: (contentType: string, body: unknown) => WideResponseBuilder;
  random: () => WideResponseBuilder;
  text: (body: unknown) => WideResponseBuilder;
  xml: (body: unknown) => WideResponseBuilder;
}

interface WideOperationArgument {
  body: unknown;
  context: unknown;
  headers: { [key: string]: string };
  path: { [key: string]: string };
  proxy: (url: string) => { proxyUrl: string };
  query: { [key: string]: string };
  response: { [key: number]: WideResponseBuilder };
}

export type { COUNTERFACT_RESPONSE };

export type {
  CookieOptions,
  ExampleNames,
  HttpStatusCode,
  MaybePromise,
  MediaType,
  OmitValueWhenNever,
  OpenApiOperation,
  OpenApiParameters,
  OpenApiResponse,
  ResponseBuilder,
  ResponseBuilderFactory,
  WideOperationArgument,
  WideResponseBuilder,
  OmitAll,
  IfHasKey,
};
