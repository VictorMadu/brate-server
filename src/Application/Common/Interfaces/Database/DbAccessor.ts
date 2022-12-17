import { PoolClient } from 'pg';

export interface DataAccessorManager {
    initialize(): Promise<void>;
    close(): Promise<void>;
}

export interface DataAccessor<T extends unknown> {
    getClient(): Promise<T>;
}
