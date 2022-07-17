import { Injectable } from "victormadu-nist-core";
import { PoolClient } from "pg";
import { PostgresDbService } from "../_utils/market.db.service";
import {
    blackRates,
    currencies,
    parallelRates,
    user_favourite_currency_pairs,
} from "../../utils/postgres-db-types/erate";
import { DbInData, InData, OutData, Payload } from "./interface";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import {
    removeTrailingZeroesFromNumeric,
    timestampToNumeric,
} from "../../utils/postgres-type-cast";

const t = "__t";
const t1 = "__t1";
const t2 = "__t2";
const prev_time = "__prev_time";
const favourites = user_favourite_currency_pairs;

interface CurrencyRate {
    quota: string;
    timestamps: number[];
    rates: string[];
}

@Injectable()
export class GetCurrencyPairListDbService {
    payload!: Payload;
    market!: "black" | "parallel";
    inData!: InData;

    constructor(
        private db: PostgresDbService,
        private helper: PostgresHeplper,
        private runner: PostgresPoolClientRunner
    ) {}

    private onReady() {
        this.runner.setPsql(this.db.getPsql());
    }

    async getTotal(): Promise<number | undefined> {
        return await this.runner.runQuery(async (psql) => await this._getTotal(psql));
    }

    async _getTotal(psql: PoolClient): Promise<number | undefined> {
        const results = await psql.query<{ total: number }>(`
    SELECT COUNT(*) as total FROM ${currencies.$$NAME}
  `);
        return this.helper.getFromFirstRow(results, "total");
    }

    async getFavourites(userId: string): Promise<string[] | undefined> {
        return this.runner.runQuery((psql) => this._getFavourites(psql, userId));
    }

    async _getFavourites(psql: PoolClient, userId: string): Promise<string[] | undefined> {
        const queryCreator = new GetFavouritesQueryCreator(this.helper.sanitize(userId));
        const result = await psql.query<{ currency_pair: string }>(queryCreator.getQuery());
        return this.helper.getFromAllRows(result, "currency_pair");
    }

    async getCurrenciesRates(inData: InData): Promise<OutData> {
        return (await this.runner.runQuery((psql) => this._getCurrenciesRates(psql, inData))) ?? [];
    }

    private async _getCurrenciesRates(psql: PoolClient, inData: InData): Promise<OutData> {
        const queryCreator = this.getMarketRateQueryCreator(inData);
        console.log("query", inData.market_type, "\n", queryCreator.getQuery());
        const result = await psql.query<CurrencyRate>(queryCreator.getQuery());
        return this.helper.getAllRows(result);
    }

    private getMarketRateQueryCreator(inData: InData) {
        const sanitizedData = this.getSanitizedInData(inData);

        if (inData.market_type === "black") return new BlackMarketRateQueryCreator(sanitizedData);
        return new ParallelMarketRateQueryCreator(sanitizedData);
    }

    private getSanitizedInData(inData: InData): DbInData {
        // TODO: Refactor this
        return {
            market_type: this.helper.sanitize(inData.market_type),
            base: this.helper.sanitize(inData.base),
            quotas: this.helper.sanitize(inData.quotas),
            from: this.helper.sanitize(inData.from),
            interval: this.helper.sanitize(inData.interval),
            limit: this.helper.sanitize(inData.limit),
            offset: this.helper.sanitize(inData.offset),
            to: this.helper.sanitize(inData.to),
        };
    }
}

class GetFavouritesQueryCreator {
    constructor(private sanitizedUserId: string) {}
    getQuery() {
        return `
    SELECT 
      ${favourites.base} || ' ' || ${favourites.quota} as currency_pair
    FROM 
      ${favourites.$$NAME}
    WHERE
      ${favourites.user_id} = ${this.sanitizedUserId} AND
      (
        ${favourites.unfavourite_at}[1] IS NULL OR
        ${this.lastItemFromCol(favourites.favourite_at)} > ${this.lastItemFromCol(
            favourites.unfavourite_at
        )})
    `;
    }

    private lastItemFromCol(colName: string) {
        return `
      ${colName} [
        array_length(${colName}, 1)
      ]
    `;
    }
}

class BlackMarketRateQueryCreator {
    interval: number;
    from: number;
    to: number;
    base: string;
    quotas: string;
    offset: number;
    limit: number;
    constructor(sanitizedData: DbInData) {
        this.interval = sanitizedData.interval;
        this.from = sanitizedData.from;
        this.to = sanitizedData.to;
        this.base = sanitizedData.base;
        this.quotas = sanitizedData.quotas;
        this.offset = sanitizedData.offset;
        this.limit = sanitizedData.limit;
    }
    getQuery() {
        return `
      SELECT 
        ${t}.${blackRates.quota} as quota,
        array_agg(${t}.${blackRates.time}) as timestamps,
        array_agg(${removeTrailingZeroesFromNumeric(`${t}.${blackRates.rate}`)}) as rates
      FROM  (
        SELECT 
          ${blackRates.quota} as ${blackRates.quota},  
          ${this.getTimestampIntervalSplitQuery()} AS ${blackRates.time},
          AVG(${t1}.${blackRates.rate}) as ${blackRates.rate}
        FROM                                                          
          ${blackRates.$$NAME} AS ${t1}
        LEFT JOIN LATERAL (
          SELECT 
            ${blackRates.time} AS ${prev_time} 
          FROM
            ${blackRates.$$NAME}
          WHERE 
            ${blackRates.base} = ${t1}.${blackRates.base} AND
            ${blackRates.seller_id} = ${t1}.${blackRates.seller_id} AND
            ${blackRates.quota} = ${t1}.${blackRates.quota} AND
            ${blackRates.time} < ${t1}.${blackRates.time}
          ORDER BY 
            ${blackRates.time} DESC NULLS LAST
            FETCH FIRST ROW ONLY
        ) ${t2} ON TRUE
      WHERE  
        ${blackRates.base} = ${this.base} AND
        ${blackRates.rate} IS NOT NULL AND
        COALESCE (${timestampToNumeric(`${t2}.${prev_time}`)}, ${timestampToNumeric(
            `${t1}.${blackRates.time}`
        )}) >= ${this.from} AND 
        ${timestampToNumeric(`${t1}.${blackRates.time}`)} <= ${this.to}
      GROUP BY 
        ${blackRates.quota}, 
        ${this.getTimestampIntervalSplitQuery()}
    ) AS ${t}
    GROUP BY 
      ${t}.${blackRates.quota}
    HAVING 
      ${t}.${blackRates.quota} <> ${this.base} AND 
      ${this.getRequiredQuotasQuery()}
    OFFSET ${this.offset}
    FETCH FIRST ${this.limit} ROWS ONLY
    `;
    }

    private getRequiredQuotasQuery() {
        if (this.quotas === "") return `TRUE`;
        return `${t}.${parallelRates.currency_id} IN (${this.quotas})`;
    }

    private getTimestampIntervalSplitQuery() {
        return `floor( ${timestampToNumeric(`${t1}.${blackRates.time}`)}/${this.interval})  * ${
            this.interval
        }`;
    }
}

class ParallelMarketRateQueryCreator {
    interval: number;
    from: number;
    to: number;
    base: string;
    quotas: string;
    offset: number;
    limit: number;
    constructor(sanitizedData: DbInData) {
        this.interval = sanitizedData.interval;
        this.from = sanitizedData.from;
        this.to = sanitizedData.to;
        this.base = sanitizedData.base;
        this.quotas = sanitizedData.quotas;
        this.offset = sanitizedData.offset;
        this.limit = sanitizedData.limit;
    }

    getQuery() {
        return `
      SELECT 
        ${t}.${parallelRates.currency_id} as quota,
        array_agg(${t}.${parallelRates.time}) as timestamps,
        array_agg(${removeTrailingZeroesFromNumeric(`${t}.${parallelRates.rate}`)}) as rates
      FROM  (
        
      SELECT 
        ${parallelRates.currency_id} as ${parallelRates.currency_id},  
        ${this.getTimestampIntervalSplitQuery()} AS ${parallelRates.time},
        AVG(${t1}.${parallelRates.rate}) as ${parallelRates.rate}
      FROM 
        ${parallelRates.$$NAME} AS ${t1}
      LEFT JOIN LATERAL (
          SELECT 
            ${parallelRates.time} AS ${prev_time} 
          FROM
            ${parallelRates.$$NAME}
          WHERE 
            ${t1}.${parallelRates.currency_id} = ${parallelRates.currency_id} AND
            ${t1}.${parallelRates.time} > ${parallelRates.time}
          ORDER BY 
            ${parallelRates.time} DESC NULLS LAST
          FETCH FIRST ROW ONLY
        ) ${t2} ON TRUE
      WHERE  
        ${parallelRates.rate} IS NOT NULL AND
        COALESCE (${timestampToNumeric(`${t2}.${prev_time}`)}, ${timestampToNumeric(
            `${t1}.${parallelRates.time}`
        )})>= ${this.from} AND 
        ${timestampToNumeric(`${t1}.${parallelRates.time}`)} <= ${this.to}
      GROUP BY 
        ${parallelRates.currency_id}, 
        ${this.getTimestampIntervalSplitQuery()}
      ) AS ${t}
      GROUP BY 
        ${t}.${parallelRates.currency_id}
      HAVING 
        ${t}.${parallelRates.currency_id} <> ${this.base} AND 
        ${this.getRequiredQuotasQuery()} 
      OFFSET ${this.offset}
      FETCH FIRST ${this.limit} ROWS ONLY
    `;
    }

    getRequiredQuotasQuery() {
        if (this.quotas === "") return `TRUE`;
        return `${t}.${parallelRates.currency_id} IN (${this.quotas})`;
    }

    getTimestampIntervalSplitQuery() {
        return `floor( ${timestampToNumeric(`${t1}.${parallelRates.time}`)}/${this.interval})  * ${
            this.interval
        }`;
    }
}
