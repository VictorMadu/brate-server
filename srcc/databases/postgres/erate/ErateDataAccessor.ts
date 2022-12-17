import { PoolClient, Pool } from 'pg';
import Config from '../../../config';
import DataAccessor from '../DbAccessor';

export default class ErateDataAccessor implements DataAccessor {
    private static pool: Pool;

    static async initialize() {
        const config = new Config();

        ErateDataAccessor.pool = new Pool({
            user: config.get('database.erate.postgres.user'),
            host: config.get('database.erate.postgres.host'),
            database: config.get('database.erate.postgres.dbName'),
            password: config.get('database.erate.postgres.pwd'),
            port: config.get('database.erate.postgres.port'),
            max: config.get('database.erate.postgres.poolSize'),
        });
    }

    static async close() {}

    getAccessor(): Promise<PoolClient> {
        return ErateDataAccessor.pool.connect();
    }
}

// TODO: Add save checkpoint
