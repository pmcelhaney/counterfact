type OmitByValue<Base, Condition> = Pick<
  Base,
  {
    [Key in keyof Base]: [Base[Key]] extends [Condition] ? never : Key;
  }[keyof Base]
>;

type StatusCodes = "200_OK" | "404_NOT_FOUND" | "500_INTERNAL_SERVER_ERROR";

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
  : OmitByValue<
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

// FlattResponse isn't quite right but close enough for now. It should return something that looks like:
// { status1, contentType1, headers1, body1 } | { status2, contentType2, headers2, body2 } | { status3, contentType3, headers3, body3 }
// It currently returns:
// { contentType1,  body1 } | { contentType2,  body2 } | { contentType3, headers3 } & { headers1 | headers2 | headers3 , status1 | status2 | status3 }

type FlattenResponses<
  Responses extends {
    [contentType: string]: {
      headers: number | { [name: string]: string };
      content: {
        contentType: string;
        body: unknown;
      };
    };
  }
> = Responses[keyof Responses]["content"] & {
  headers: Responses[keyof Responses]["headers"];
  status: StatusCodes;
};

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

/* ************************************************************************ */
/* ************************************************************************ */
/* ************************************************************************ */
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
  DEFAULT: {
    headers: {
      "x-default-header": string;
    };
    content:
      | {
          contentType: "text/plain";
          body: string;
        }
      | { contentType: "text/html"; body: string };
  };
};

export type HTTP_GET = ({
  response,
  context,
}: {
  response: BuildResponseType<Omit<Responses, "DEFAULT">>;
  context: { found: () => boolean; message: () => "Hello World" };
}) => FlattenResponses<Responses>;

/* ************************************************************************ */
/* ************************************************************************ */
/* ************************************************************************ */

// How it's used in the paths/**/*.ts file
export const GET: HTTP_GET = ({ response, context }) => {
  if (!context.found()) {
    return response["404_NOT_FOUND"]
      .match("text/plain", "not found", { "x-404-header": "bar" })
      .match("text/html", "<h1>not found</h1>")
      .match("application/json", { message: "not found" });
  }

  return response["200_OK"]
    .text(context.message(), { "x-custom-header": "bar" })
    .html(`<h1>${context.message()}</h1>`)
    .json({ message: context.message() });
};
