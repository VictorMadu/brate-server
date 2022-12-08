import { PoolClient } from 'pg';

export default interface DataAccessor {
    getAccessor(): Promise<PoolClient>;
}
