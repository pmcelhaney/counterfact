type MediaType = `${string}/${string}`;

type CounterfactResponse = {
    status: number,
    headers: Record<string, string | number>,
    content: Array<{type: MediaType, body: unknown}>
}

type ResponseBuilder = CounterfactResponse & {
    match?: (type: MediaType, body: unknown) => ResponseBuilder,
    text?: (body: unknown) => ResponseBuilder,
    json?: (body: unknown) => ResponseBuilder,
    html?: (body: unknown) => ResponseBuilder,
    random?: () => CounterfactResponse
}

export type ResponseBuilderBuilder =  Record<`${number}${string}`, ResponseBuilder>
