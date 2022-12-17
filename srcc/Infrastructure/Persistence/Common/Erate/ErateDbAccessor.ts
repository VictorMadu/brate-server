import { PoolClient, Pool } from 'pg';
import Config from '../../../../Domain/Config';
import DbAccessor from '../Interfaces/DbAccessor';

export default class ErateDbAccessor implements DbAccessor {
    private static pool: Pool;

    static async initialize() {
        const config = new Config();

        ErateDbAccessor.pool = new Pool({
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
        return ErateDbAccessor.pool.connect();
    }
}

// TODO: Add save checkpoint
