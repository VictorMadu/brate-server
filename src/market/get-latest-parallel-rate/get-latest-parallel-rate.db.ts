import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/market.db.service";
import { PoolClient } from "pg";
import { parallelRates, user_favourite_currency_pairs } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import { toBoolean, toFloat, toString } from "../../utils/postgres-type-cast";

// const  = "__t1";
const latestAndPrevCurrencyRateForBase = "__t2";
const latestCurrencyRate = "__t3";
const latestAndPrevCurrencyRate = "__t4";
const w = "__w";
const prev_rate = "__prev_rate";

interface InData {
    userId?: string;
    base: string;
    pageOffset: number;
    pageCount: number;
    filter: "all" | "favourite" | "unfavourite";
}

interface OutData {
    pair: string;
    rate: string;
    prev_rate: string;
    is_favourite?: boolean;
}

@Injectable()
export class DbService {
    constructor(
        private db: PostgresDbService,
        private helper: PostgresHeplper,
        private runner: PostgresPoolClientRunner
    ) {}

    private onReady() {
        this.runner.setPsql(this.db.getPsql());
    }

    async getLatestRate(inData: InData): Promise<OutData[] | undefined> {
        return await this.runner.runQuery(async (psql) => await this._getLatestRate(psql, inData));
    }

    async _getLatestRate(psql: PoolClient, inData: InData): Promise<OutData[] | undefined> {
        const queryCreator = new GetLastestParallelRateQueryCreator(this.helper, inData);
        console.log("_getLatestParallelRate query", queryCreator.getQuery());
        const result = await psql.query<OutData>(queryCreator.getQuery());
        return this.helper.getAllRows(result);
    }
}

// TODO: Split using state pattern
class FavouriteQuery {
    constructor(
        private sanitizedUserId: string,
        private filter: "all" | "favourite" | "unfavourite"
    ) {}

    getIsFavouriteQuery(baseQuery: string, quotaQuery: string) {
        const { $$NAME, base, quota, user_id, favourite_at, unfavourite_at } =
            user_favourite_currency_pairs;
        return `EXISTS (
            SELECT 1 
            FROM ${$$NAME} 
            WHERE 
                ${user_id} = ${this.sanitizedUserId} AND 
                ${base} = ${baseQuery} AND 
                ${quota} = ${quotaQuery} AND 
                (${this.firstArrayItemOfColQuery(
                    favourite_at
                )} IS NULL OR ${this.lastArrayItemOfColQuery(
            favourite_at
        )} > ${this.lastArrayItemOfColQuery(unfavourite_at)})
        )`;
    }

    private lastArrayItemOfColQuery(colName: string) {
        return `${colName}[array_length(${colName}, 1)]`;
    }

    private firstArrayItemOfColQuery(colName: string) {
        return `${colName}[1]`;
    }
}
// TODO: Think of leaving rate in string format
class GetLastestParallelRateQueryCreator {
    private userId: string | undefined;
    private offset: number;
    private count: number;
    private base: string;
    private filter: "all" | "favourite" | "unfavourite";

    constructor(helper: PostgresHeplper, inData: InData) {
        this.userId = helper.sanitize(inData.userId);
        this.offset = helper.sanitize(inData.pageOffset);
        this.count = helper.sanitize(inData.pageCount);
        this.base = helper.sanitize(inData.base);
        this.filter = inData.filter;
    }

    // TODO: Also send the timestamp (time) of the rate
    getQuery() {
        const { $$NAME, currency_id, rate, time } = parallelRates;
        return `
    WITH ${latestCurrencyRate} AS (
      SELECT DISTINCT ON(${currency_id})
        ${currency_id} as ${currency_id}, 
        FIRST_VALUE(${rate}) OVER w AS ${rate},
        FIRST_VALUE(${time}) OVER w AS ${time}
      FROM ${$$NAME}
      WINDOW w AS (PARTITION BY ${currency_id} ORDER BY ${time} DESC NULLS LAST)
    ),
      ${latestAndPrevCurrencyRate} AS (
        SELECT 
          ${latestCurrencyRate}.${currency_id} as ${currency_id},
          ${latestCurrencyRate}.${rate} as ${rate},
          COALESCE(t2.${prev_rate}, ${latestCurrencyRate}.${rate}) as ${prev_rate}
        FROM ${latestCurrencyRate} 
        LEFT JOIN LATERAL (
          SELECT 
              ${rate} AS ${prev_rate}
            FROM 
              ${$$NAME}
            WHERE 
              ${currency_id} = ${latestCurrencyRate}.${currency_id} AND 
              ${time} < ${latestCurrencyRate}.${time} 
            ORDER BY 
              ${time} DESC NULLS LAST
            FETCH FIRST ROW ONLY
        ) AS t2
        ON TRUE
      ),
      ${latestAndPrevCurrencyRateForBase} AS (
      SELECT ${currency_id},${rate},${prev_rate} 
      FROM ${latestAndPrevCurrencyRate} 
      WHERE ${latestAndPrevCurrencyRate}.${currency_id}=${this.base}
    )

    SELECT 
      ${toString(this.pairSelect())}  AS pair,
      ${toBoolean(this.isFavouriteSelect())} AS is_favourite,
      ${toFloat(this.prevRateSelect())} AS prev_rate,
      ${toFloat(this.rateSelect())} AS rate
    FROM 
      ${latestAndPrevCurrencyRate}
    WHERE ${latestAndPrevCurrencyRate}.${currency_id} <> 
      ${selectFromQuery(currency_id, latestAndPrevCurrencyRateForBase)}
    OFFSET ${this.offset}
    FETCH FIRST ${this.count} ROWS ONLY
    `;
    }

    private pairSelect() {
        const currency_id = parallelRates.currency_id;
        return `${selectFromQuery(
            currency_id,
            latestAndPrevCurrencyRateForBase
        )} || ' ' || ${latestAndPrevCurrencyRate}.${currency_id}`;
    }

    private isFavouriteSelect() {
        const currency_id = parallelRates.currency_id;
        if (!this.userId) return `NULL`;

        const favouriteQuery = new FavouriteQuery(this.userId, this.filter);
        return `${favouriteQuery.getIsFavouriteQuery(
            selectFromQuery(currency_id, latestAndPrevCurrencyRateForBase),
            `${latestAndPrevCurrencyRate}.${currency_id}`
        )}`;
    }

    private prevRateSelect() {
        return `${latestAndPrevCurrencyRate}.${prev_rate}/${selectFromQuery(
            prev_rate,
            latestAndPrevCurrencyRateForBase
        )}`;
    }

    private rateSelect() {
        const rate = parallelRates.rate;
        return `${latestAndPrevCurrencyRate}.${rate}/${selectFromQuery(
            rate,
            latestAndPrevCurrencyRateForBase
        )}`;
    }
}

const selectFromQuery = (colName: string, tableName: string) => {
    return `(SELECT ${colName} FROM ${tableName})`;
};
