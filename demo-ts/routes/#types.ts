import type { HttpResponseStatusCode } from "../types/Http";

import type { Store } from '../types/Store';

export type Get_count = (request: {
    store: Store;
    query: { }; // There no querystring parameters
    path: { }; // There are no parameters in the path
}) => { body: string, status?: HttpResponseStatusCode };


