import type { Store } from '../types/Store';

type GetRequest = {
    store: Store;
    query: { [name: string]: string };
    path: { [name: string]: string };
}

export type Get_count = (request: GetRequest) => { body: string, status?: number };


