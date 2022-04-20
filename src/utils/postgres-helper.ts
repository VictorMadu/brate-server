import { Injectable } from "nist-core/injectables";
import { Client, PoolClient, QueryResult, QueryResultRow } from "pg";
import { get, isString } from "lodash";
import { InnerValue } from "ts-util-types";

@Injectable()
export class PostgresHeplper {
  getPropFromNthRow<T extends QueryResultRow, K extends string>(
    queryResult: QueryResult<T>,
    rowIndex: number,
    prop: K
  ) {
    return get(queryResult.rows, `${rowIndex}.${prop}`) as InnerValue<T, K> | undefined;
  }

  getPropFromFirstRow<T extends QueryResultRow, K extends string>(
    queryResult: QueryResult<T>,
    prop: K
  ) {
    return this.getPropFromNthRow(queryResult, 1, prop);
  }

  getFromNthRow<T extends QueryResultRow>(queryResult: QueryResult<T>, rowIndex: number) {
    return queryResult.rows[rowIndex] as undefined | T;
  }

  getFromFirstRow<T extends QueryResultRow>(queryResult: QueryResult<T>) {
    return this.getFromNthRow(queryResult, 1);
  }

  sanitize(d: any) {
    if (isString(d)) return this.sanitizeStr(d);
    return d;
  }

  sanitizeStr(str: string) {
    return str.replace(/'/g, "''");
  }

  async beginTransaction(psql: PoolClient | Client) {
    return await psql.query("BEGIN");
  }

  async endClientTransaction(psql: Client, data?: any) {
    return await this.endTransaction(psql, data);
  }

  async endPoolClientTransaction(psql: PoolClient, data?: any) {
    await this.endTransaction(psql, data);
    return psql.release();
  }

  private async endTransaction(psql: Client | PoolClient, data?: any) {
    if (data === undefined) return await psql.query("ROLLBACK");
    return await psql.query("COMMIT");
  }
}
