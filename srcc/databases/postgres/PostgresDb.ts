import { PoolClient, QueryResult } from 'pg';
import format from 'pg-format';
import { logExecutionTime } from '../../log-execution-time';
import { Manager, Runner } from '../db';

export default class PostgresDb implements Manager, Runner<string, QueryResult<any>> {
    constructor(private client: PoolClient) {}

    async manage(...funcs: (() => any)[]): Promise<void> {
        try {
            await this.client.query('BEGIN');

            for (let i = 0; i < funcs.length; i++) {
                await funcs[i]();
            }

            await this.client.query('COMMIT');
        } catch (error) {
            this.client.query('ROLLBACK');
            throw error;
        } finally {
            this.client.release();
        }
    }

    async run(queryString: string, ...values: any[]): Promise<QueryResult<any>> {
        return logExecutionTime(
            () => this.client.query(format(queryString, ...values), []),
            'DB Execution Time =>',
        );
    }
}
