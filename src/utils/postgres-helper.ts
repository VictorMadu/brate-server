import { Injectable } from "nist-core/injectables";
import { QueryResult, QueryResultRow } from "pg";
import { get } from "lodash";
import { InnerValue } from "ts-util-types";

@Injectable()
export class PostgresHeplper {
  getFromNthRow<T extends QueryResultRow, K extends string>(
    queryResult: QueryResult<T>,
    prop: K,
    rowIndex: number
  ) {
    return get(queryResult.rows, `${rowIndex}.${prop}`) as InnerValue<T, K> | undefined;
  }

  getFromFirstRow<T extends QueryResultRow, K extends string>(
    queryResult: QueryResult<T>,
    prop: K
  ) {
    return this.getFromNthRow(queryResult, prop, 1);
  }

  sanitizeStr(str: string) {
    return str.replace(/'/g, "''");
  }
}
