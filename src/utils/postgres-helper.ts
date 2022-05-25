import { Injectable } from "nist-core/injectables";
import { Client, PoolClient, QueryResult, QueryResultRow } from "pg";
import { get, isString, map, reduce, isNumber } from "lodash";
import { InnerValue } from "ts-util-types";

abstract class PostgresRunnerBase<P extends Client | PoolClient> {
  psql!: P;
  protected abstract cleanUpTransaction(psql: P): Promise<any>;

  setPsql(psql: P) {
    this.psql = psql;
  }

  async runQuery<T extends unknown>(
    queryFn: (psql: P) => Promise<T>
  ): Promise<T | undefined> {
    try {
      return await this.runTransaction(queryFn);
    } catch (error) {
      await this.catchFailedTransaction();
    }
    return undefined;
  }

  private async runTransaction<T extends unknown>(
    queryFn: (psql: P) => Promise<T>
  ): Promise<T | undefined> {
    await this.beginTransaction();
    const result = await queryFn(this.psql);
    await this.endTransaction(result);
    return result;
  }

  private async catchFailedTransaction() {
    return await this.endTransaction(undefined);
  }

  private async beginTransaction() {
    return await this.psql.query("BEGIN");
  }

  private async endTransaction(data?: any) {
    if (data == null) await this.psql.query("ROLLBACK");
    else await this.psql.query("COMMIT");
    return this.cleanUpTransaction(this.psql);
  }
}

@Injectable(false)
export class PostgresPoolClientRunner extends PostgresRunnerBase<PoolClient> {
  protected async cleanUpTransaction(psql: PoolClient) {
    return;
  }
}

@Injectable(false)
export class PostgresClientRunner extends PostgresRunnerBase<Client> {
  protected async cleanUpTransaction(psql: Client) {
    return;
  }
}

// TODO: Helper for multiple queries in one query
@Injectable()
export class PostgresHeplper {
  getFromNthRow<T extends QueryResultRow, K extends string>(
    queryResult: QueryResult<T>,
    rowIndex: number,
    prop: K
  ) {
    return get(this.getAllRows(queryResult), `${rowIndex}.${prop}`) as
      | InnerValue<T, K>
      | undefined;
  }

  getFromFirstRow<T extends QueryResultRow, K extends string>(
    queryResult: QueryResult<T>,
    prop: K
  ) {
    return this.getFromNthRow(queryResult, 0, prop);
  }

  getNthRow<T extends QueryResultRow>(
    queryResult: QueryResult<T>,
    rowIndex: number
  ) {
    return this.getAllRows(queryResult)[rowIndex] as undefined | T;
  }

  getFirstRow<T extends QueryResultRow>(queryResult: QueryResult<T>) {
    return this.getNthRow(queryResult, 0);
  }

  getAllRows<T extends QueryResultRow>(queryResult: QueryResult<T>) {
    return queryResult.rows;
  }

  getFromAllRows<T extends QueryResultRow, K extends string>(
    queryResult: QueryResult<T>,
    prop: K
  ) {
    const len = this.getRowLength(queryResult);
    const arr = Array<InnerValue<T, K>>(len);
    let i = 0;

    while (i < len) {
      arr[i] = this.getFromNthRow(queryResult, i, prop) as InnerValue<T, K>;
      i++;
    }

    return arr;
  }

  getRowLength<T extends QueryResultRow>(queryResult: QueryResult<T>) {
    return queryResult.rows.length;
  }

  getAlteredRowLenth<T extends QueryResultRow>(queryResult: QueryResult<T>) {
    return queryResult.rowCount;
  }

  sanitize(d: any) {
    if (isString(d)) return this.sanitizeStr(d);
    if (isNumber(d)) return this.sanitizeNum(d);
    if (Array.isArray(d)) return this.sanitizeArray(d);
    return d;
  }

  sanitizeStr(str: string) {
    return `'${str.replace(/'/g, "''")}'`;
  }

  sanitizeNum(num: number) {
    if (num === Number.POSITIVE_INFINITY) return "infinity";
    if (num === Number.NEGATIVE_INFINITY) return "-infinity";
    return num;
  }

  sanitizeArray(collections: any[]) {
    return reduce(
      collections,
      (transformedCollections, item) => {
        transformedCollections += "," + this.sanitize(item);
        return transformedCollections;
      },
      ""
    ).slice(1);
  }

  hasAlteredTable(result: QueryResult<any>) {
    return result.rowCount != null && result.rowCount > 0;
  }
}
