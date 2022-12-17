import { PoolClient, Pool } from 'pg';
import Config from '../../Application/Common/Config';
import {
    DataAccessor,
    DataAccessorManager,
} from '../../Application/Common/Interfaces/Database/DbAccessor';
// import DataAccessor from '../../Application/Common/Interfaces/Database/DbAccessor';

export default class ErateDataAccessor implements DataAccessorManager, DataAccessor<PoolClient> {
    private pool!: Pool;

    constructor(private config: Config) {}

    async initialize() {
        this.pool = new Pool({
            user: this.config.get('database.erate.postgres.user'),
            host: this.config.get('database.erate.postgres.host'),
            database: this.config.get('database.erate.postgres.dbName'),
            password: this.config.get('database.erate.postgres.pwd'),
            port: this.config.get('database.erate.postgres.port'),
            max: this.config.get('database.erate.postgres.poolSize'),
        });
    }

    async close() {
        await this.pool.end();
    }

    async getClient() {
        return this.pool.connect();
    }
}

// TODO: Add save checkpoint
