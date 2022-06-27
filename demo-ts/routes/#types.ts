import type { Store } from '../types/Store';


export type Get_count = (request: {
    store: Store;
    query: { };
    path: { };
}) => { body: string, status?: number };


