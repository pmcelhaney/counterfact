import type { Store } from '../../types/Store';

type GetRequest = {
    store: Store;
    query: { [name: string]: string };
    path: { [name: string]: string };
}

export type Get_name = (request: GetRequest) => { body: string, status?: number };

export type Get_kitty = (request: GetRequest) => { body: string, status?: number };

