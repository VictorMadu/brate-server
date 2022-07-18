import { Injectable } from "victormadu-nist-core";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { PoolClient } from "pg";
import { user_favourite_currency_pairs } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

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

    async addToFavourite(inData: InData): Promise<number> {
        return (
            (await this.runner.runQuery((psql) =>
                this.createFavouriteOrUpdateItsFavouritesAtTime(psql, inData)
            )) ?? 0
        );
    }

    async createFavouriteOrUpdateItsFavouritesAtTime(psql: PoolClient, inData: InData) {
        const queryCreator = new FavouriteOrUpdateItsFavouritesAtTimeQueryCreator(
            inData,
            this.helper
        );

        const result = await psql.query(queryCreator.getQuery());
        return this.helper.getAlteredRowLenth(result);
    }
}

// TODO: Create a Sanitizer interface and do to other db service queryCreator
class FavouriteOrUpdateItsFavouritesAtTimeQueryCreator {
    private userId: string;
    private base: string;
    private quota: string;
    constructor(inData: InData, sanitizer: { sanitize: (obj: any) => any }) {
        this.userId = sanitizer.sanitize(inData.userId);
        this.base = sanitizer.sanitize(inData.base);
        this.quota = sanitizer.sanitize(inData.quota);
    }

    getQuery() {
        const a = "__a";
        return `
      WITH ${a} AS (${this.favouriteDetailsQuery()})

      INSERT INTO
      ${table.$$NAME}
      (
        ${table.user_id},
        ${table.base},
        ${table.quota},
        ${table.favourite_at},
        ${table.unfavourite_at}
      )
      SELECT 
        (${this.userId})::uuid AS ${table.user_id},
        ${this.base} AS ${table.base},
        ${this.quota} AS ${table.quota},
        ARRAY[NOW()]::TIMESTAMPTZ[],
        ARRAY[]::TIMESTAMPTZ[]
      WHERE
        NOT EXISTS (SELECT * FROM ${a}) OR
        (
          ${this.getNthItemFromArr(`SELECT ${table.favourite_at} FROM ${a}`, "1")} IS NULL AND
          ${this.getNthItemFromArr(`SELECT ${table.unfavourite_at} FROM ${a}`, "1")} IS NULL
        ) OR
        (
          ${this.getLastItemFromArr(
              this.coalesceTodefaultArr(`SELECT ${table.favourite_at} FROM ${a}`, "TIMESTAMPTZ[]")
          )} < 
          ${this.getLastItemFromArr(
              this.coalesceTodefaultArr(`SELECT ${table.unfavourite_at} FROM ${a}`, "TIMESTAMPTZ[]")
          )} 
        )
    ON CONFLICT(${table.user_id}, ${table.base}, ${table.quota}) DO UPDATE
    SET
      ${table.favourite_at} = array_append(EXCLUDED.${table.favourite_at}, NOW())
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

    private favouriteDetailsQuery() {
        return `  
      SELECT 
        ${table.favourite_at},
        ${table.unfavourite_at}
      FROM 
        ${table.$$NAME}
      WHERE
        ${table.user_id} = ${this.userId} AND
        ${table.base} = ${this.base} AND
        ${table.quota} = ${this.quota}
  `;
    }
}
