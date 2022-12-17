import { Pool, PoolClient, QueryResult } from 'pg';
import format from 'pg-format';
import { Runner } from '../Application/Common/Interfaces/Database/Runner';
import { DbManager } from '../Application/Common/Interfaces/Database/DbManager';
import { DataAccessor } from '../Application/Common/Interfaces/Database/DbAccessor';

export default class PostgresDb implements Runner<string, QueryResult<any>> {
    constructor(private dataAccessor: DataAccessor<PoolClient>) {}

    async run(queryString: string, ...values: any[]): Promise<QueryResult<any>> {
        const client = await this.dataAccessor.getClient();
        console.log('CLient connected');
        const builtQuery = format(queryString, ...values);
        console.log('QUERY STRING', builtQuery, values);
        let result: QueryResult<any>;
        try {
            result = await client.query(builtQuery, []);
        } finally {
            client.release();
            console.log('CLient release');
        }

        return result;
    }
}
