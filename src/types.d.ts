type StatusCodeWithDescription = `${number}${string}`;

type OpenApiHeader = {
  schema: unknown;
};

type OpenApiContent = {
  schema: unknown;
};

type OmitValueWhenNever<Base> = Pick<
  Base,
  {
    [Key in keyof Base]: [Base[Key]] extends [never] ? never : Key;
  }[keyof Base]
>;

type OpenApiResponse = {
  headers: Record<string, OpenApiHeader>;
  content: Record<MediaType, OpenApiContent>;
};

type OpenApiResponses = Record<string, OpenApiResponse>;

type MediaType = `${string}/${string}`;

type CounterfactResponse = {
  status: number;
  headers: Record<string, string | number>;
  content: Array<{ type: MediaType; body: unknown }>;
};

type IfHasKey<R, Key, Yes, No> = Key extends keyof R ? Yes : No;

type MaybeShortcut<
  ContentType extends MediaType,
  Response extends OpenApiResponse
> = IfHasKey<
  Response["content"],
  ContentType,
  (body: Response["content"][ContentType]["schema"]) => ResponseBuilder<{
    headers: Response["headers"];
    content: Omit<Response["content"], ContentType>;
  }>,
  never
>;

type MatchFunction<Response extends OpenApiResponse> = <
  ContentType extends MediaType & keyof Response["content"]
>(
  contentType: ContentType,
  body: Response["content"][ContentType]["schema"]
) => ResponseBuilder<{
  headers: Response["headers"];
  content: Omit<Response["content"], ContentType>;
}>;

type HeaderFunction<Response extends OpenApiResponse> = <
  Header extends string & keyof Response["headers"]
>(
  header: Header,
  value: Response["headers"][Header]["schema"]
) => ResponseBuilder<{
  content: Response["content"];
  headers: Omit<Response["headers"], Header>;
}>;

type ResponseBuilder<Response extends OpenApiResponse> = [
  keyof Response["content"]
] extends [never]
  ? CounterfactResponse
  : OmitValueWhenNever<{
      header: [keyof Response["headers"]] extends [never]
        ? never
        : HeaderFunction<Response>;
      match: [keyof Response["content"]] extends [never]
        ? never
        : MatchFunction<Response>;
      text: MaybeShortcut<"text/plain", Response>;
      json: MaybeShortcut<"application/json", Response>;
      html: MaybeShortcut<"text/html", Response>;
      random: [keyof Response["content"]] extends [never]
        ? never
        : () => CounterfactResponse;
    }>;

export type ResponseBuilderBuilder<Responses extends OpenApiResponses> = {
  [StatusCode in keyof Responses]: ResponseBuilder<Responses[StatusCode]>;
} & Record<string, ResponseBuilder<Responses["default"]>>;


/* 
// Usage:


type Responses = {
  "200": {
    headers: {
      "x-string": {
        schema: string;
      };
      "x-number": {
        schema: number;
      };
    };
    content: {
      "text/plain": {
        schema: string;
      };
      "application/json": {
        schema: number[];
      };
    };
  };

  default: {
    headers: {};
    content: {
      "text/plain": {
        schema: string;
      };
    };
  };
};

type HTTP_GET = (
  response: ResponseBuilderBuilder<Responses>
) => CounterfactResponse;

const GET: HTTP_GET = (response) => {
  // return {content: [{ type: "text/plain", body: "x"}], headers: {}, status: 200 }

  return response["200"]
    .header("x-string", "x")
    .json([2])
    .header("x-number", 5)
    .random();
};
*/
