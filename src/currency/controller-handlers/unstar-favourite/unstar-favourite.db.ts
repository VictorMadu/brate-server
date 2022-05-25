import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { PoolClient } from "pg";
import { user_favourite_currency_pairs } from "../../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../../utils/postgres-helper";

const table = user_favourite_currency_pairs;

interface InData {
  userId: string;
  base: string;
  quota: string;
}

@Injectable()
export class DbService {
  constructor(
    private currencyDb: CurrencyPostgresDbService,
    private helper: PostgresHeplper,
    private runner: PostgresPoolClientRunner
  ) {}

  private onReady() {
    this.runner.setPsql(this.currencyDb.getPsql());
  }

  async removeToFavourite(inData: InData): Promise<number> {
    return (
      (await this.runner.runQuery(
        async (psql) => await this.addCurrTimeToDeletedField(psql, inData)
      )) ?? 0
    );
  }

  async addCurrTimeToDeletedField(psql: PoolClient, inData: InData) {
    const queryCreator = new AddCurrTimeToDeletedFieldQueryCreator(inData, this.helper);
    const result = await psql.query(queryCreator.getQuery());
    return this.helper.getAlteredRowLenth(result);
  }
}

class AddCurrTimeToDeletedFieldQueryCreator {
  private userId: string;
  private base: string;
  private quota: string;
  constructor(inData: InData, sanitizer: { sanitize: (obj: any) => any }) {
    this.userId = sanitizer.sanitize(inData.userId);
    this.base = sanitizer.sanitize(inData.base);
    this.quota = sanitizer.sanitize(inData.quota);
  }

  getQuery() {
    return `
    UPDATE
      ${table.$$NAME}
    SET
      ${table.unfavourite_at} = array_append(${table.unfavourite_at}, NOW())
    WHERE
      ${table.user_id} = ${this.userId} AND
      ${table.base} = ${this.base} AND
      ${table.quota} = ${this.quota} AND
      (
        ${this.getLastItemFromArr(
          this.coalesceTodefaultArr(table.unfavourite_at, "TIMESTAMPTZ[]")
        )} IS NULL OR 
        ${this.getLastItemFromArr(
          this.coalesceTodefaultArr(table.favourite_at, "TIMESTAMPTZ[]")
        )} >= 
        ${this.getLastItemFromArr(this.coalesceTodefaultArr(table.unfavourite_at, "TIMESTAMPTZ[]"))}
      )
    `;
  }

  private getLastItemFromArr(arrQuery: string) {
    const _arrQuery = `(${arrQuery})`;
    return `${this.getNthItemFromArr(_arrQuery, `array_length(${_arrQuery},1)`)}`;
  }

  private getNthItemFromArr(arrQuery: string, nthQuery: string) {
    const _arrQuery = `(${arrQuery})`;
    const _nthQuery = `(${nthQuery})`;
    return `${_arrQuery}[${_nthQuery}]`;
  }

  private coalesceTodefaultArr(arrQuery: string, datatype: string) {
    const _arrQuery = `(${arrQuery})`;
    return `COALESCE(${_arrQuery}, ARRAY[]::${datatype})`;
  }
}
