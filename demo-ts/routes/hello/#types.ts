import type { Store } from '../../types/Store';

export type Get_name = (request: {
    store: Store;
    query: { greeting: string };
    path: { name: string };
}) => { body: string, status?: number };

export type Get_kitty = (request: {
    store: Store;
    query: { greeting: string };
    path: { name: string };
}) => { body: string, status?: number };

