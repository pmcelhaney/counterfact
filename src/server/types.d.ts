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
) => GenericResponseBuilder<{
  content: Omit<Response["content"], ContentType>;
  headers: Response["headers"];
}>;

type HeaderFunction<Response extends OpenApiResponse> = <
  Header extends string & keyof Response["headers"],
>(
  header: Header,
  value: Response["headers"][Header]["schema"],
) => GenericResponseBuilder<{
  content: Response["content"];
  headers: Omit<Response["headers"], Header>;
}>;

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
}

type GenericResponseBuilder<
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
          schema: unknown;
        };
      };
      examples?: { [key: string]: unknown };
      schema?: unknown;
    };
  };
}

export type {
  HttpStatusCode,
  MediaType,
  OpenApiOperation,
  OpenApiParameters,
  OpenApiResponse,
  ResponseBuilder,
  ResponseBuilderFactory,
};
