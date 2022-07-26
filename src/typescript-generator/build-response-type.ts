type Except<Base, Condition> = Pick<
  Base,
  {
    [Key in keyof Base]: [Base[Key]] extends [Condition] ? never : Key;
  }[keyof Base]
>;

type StatusCodes = `${number}_${string}`;

interface CounterfactResponse {
  status?: StatusCodes;
  contentType: string;
  body?: unknown;
  headers?: { [key: string]: number | string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Anything = any;

interface AnyResponseWithContentType<ContentType> {
  contentType: ContentType;
  status: Anything;
  body: Anything;
  headers: Anything;
}

type MatchFunction<
  AllResponses extends CounterfactResponse,
  RemainingResponses extends AllResponses = AllResponses
> = <ContentType extends RemainingResponses["contentType"]>(
  contentType: ContentType,
  body: Extract<
    RemainingResponses,
    AnyResponseWithContentType<ContentType>
  >["body"],
  headers?: Extract<
    RemainingResponses,
    AnyResponseWithContentType<ContentType>
  >["headers"]
) => BuildResponseTypeForStatusCode<
  AllResponses,
  Exclude<RemainingResponses, AnyResponseWithContentType<ContentType>>
>;

type IfResponsesHaveContentType<Responses, ContentType, Result> =
  AnyResponseWithContentType<ContentType> extends Responses ? Result : never;

type ShortcutFunction<
  AllResponses extends CounterfactResponse,
  RemainingResponses extends AllResponses = AllResponses,
  ContentType extends RemainingResponses["contentType"] = AllResponses["contentType"]
> = (
  body: Extract<RemainingResponses, { contentType: ContentType }>["body"],
  headers?: Extract<
    RemainingResponses,
    AnyResponseWithContentType<ContentType>
  >["headers"]
) => BuildResponseTypeForStatusCode<
  AllResponses,
  Exclude<RemainingResponses, AnyResponseWithContentType<ContentType>>
>;

type MaybeShortcutFunction<
  AllResponses extends CounterfactResponse,
  RemainingResponses extends AllResponses,
  ContentType extends RemainingResponses["contentType"] = AllResponses["contentType"]
> = IfResponsesHaveContentType<
  RemainingResponses,
  ContentType,
  ShortcutFunction<AllResponses, RemainingResponses, ContentType>
>;

type BuildResponseTypeForStatusCode<
  AllResponses extends CounterfactResponse,
  RemainingResponses extends AllResponses = AllResponses
> = [RemainingResponses] extends [never]
  ? AllResponses
  : Except<
      {
        match: MatchFunction<AllResponses, RemainingResponses>;
        json: MaybeShortcutFunction<
          AllResponses,
          RemainingResponses,
          "application/json"
        >;
        text: MaybeShortcutFunction<
          AllResponses,
          RemainingResponses,
          "text/plain"
        >;
        html: MaybeShortcutFunction<
          AllResponses,
          RemainingResponses,
          "text/html"
        >;
      },
      never
    >;

// eslint-disable-next-line import/exports-last
export type BuildResponseType<
  ResponsesForStatusCode extends {
    [key: string]: {
      content: CounterfactResponse;
      headers?: { [key: string]: number | string };
    };
  }
> = {
  [StatusCode in keyof ResponsesForStatusCode]: BuildResponseTypeForStatusCode<
    ResponsesForStatusCode[StatusCode]["content"] & {
      headers: ResponsesForStatusCode[StatusCode]["headers"];
      status: StatusCode;
    }
  >;
};

// This goes in the generated path-types/**/*.types.ts file
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Responses = {
  "200_OK": {
    headers: {
      "x-custom-header": string;
    };
    content:
      | {
          contentType: "text/plain";
          body: string;
        }
      | { contentType: "application/json"; body: { message: string } }
      | { contentType: "text/html"; body: string };
  };
  "404_NOT_FOUND": {
    headers: {
      "x-404-header": string;
    };
    content:
      | {
          contentType: "text/plain";
          body: string;
        }
      | { contentType: "application/json"; body: { message: string } }
      | { contentType: "text/html"; body: string };
  };
};

export type HTTP_GET = ({
  response,
  context,
}: {
  response: BuildResponseType<Responses>;
  context: { found: () => boolean; message: () => "Hello World" };
}) => Responses[keyof Responses]["content"];

// How it's used in the paths/**/*.ts file
export const GET: HTTP_GET = ({
  response,
  context,
}: {
  response: BuildResponseType<Responses>;
  context: { found: () => boolean; message: () => "Hello World" };
}) => {
  if (!context.found()) {
    return response["404_NOT_FOUND"]
      .match("text/plain", "not found", { "x-404-header": "bar" })
      .match("text/html", "<h1>not found</h1>")
      .match("application/json", { message: "not found" });
  }

  return response["200_OK"]
    .text("Hello World", { "x-custom-header": "bar" })
    .html("<h1>Hello World</h1>")
    .json({ message: "Hello World" });
};
