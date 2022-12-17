import { PoolClient } from 'pg';

export default interface DbAccessor {
    getAccessor(): Promise<PoolClient>;
}
