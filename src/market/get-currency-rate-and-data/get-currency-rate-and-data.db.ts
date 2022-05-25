import { PostgresDbService } from "../_utils/market.db.service";
import { Injectable } from "nist-core/injectables";
import { PoolClient } from "pg";
import {
  blackRates,
  currencies,
  parallelRates,
  user_favourite_currency_pairs,
} from "../../utils/postgres-db-types/erate";
import { InData, OutData, Payload } from "./interface";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../utils/postgres-helper";

const t = "__t";
const t1 = "__t1";
const t2 = "__t2";
const prev_time = "__prev_time";
const favourites = user_favourite_currency_pairs;

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
    return await this.runner.runQuery(
      async (psql) => await this._getTotal(psql)
    );
  }

  async _getTotal(psql: PoolClient): Promise<number | undefined> {
    const results = await psql.query<{ total: number }>(`
    SELECT COUNT(*) as total FROM ${currencies.$$NAME}
  `);
    return this.helper.getFromFirstRow(results, "total");
  }

  async getFavourites(userId: string): Promise<string[] | undefined> {
    return await this.runner.runQuery(
      async (psql) => await this._getFavourites(psql, userId)
    );
  }

  async _getFavourites(
    psql: PoolClient,
    userId: string
  ): Promise<string[] | undefined> {
    const queryCreator = new GetFavouritesQueryCreator(
      this.helper.sanitize(userId)
    );
    const result = await psql.query<{ currency_pair: string }>(
      queryCreator.getQuery()
    );
    return this.helper.getFromAllRows(result, "currency_pair");
  }

  async getCurrenciesRates(inData: InData): Promise<OutData> {
    return (
      (await this.runner.runQuery(
        async (psql) => await this._getCurrenciesRates(psql, inData)
      )) ?? []
    );
  }

  private async _getCurrenciesRates(
    psql: PoolClient,
    inData: InData
  ): Promise<OutData> {
    const queryCreator = this.getMarketRateQueryCreator(inData);
    const result = await psql.query<{
      quota: string;
      timestamps: number[];
      rates: string[];
    }>(queryCreator.getQuery());
    return this.helper.getAllRows(result);
  }

  private getMarketRateQueryCreator(inData: InData) {
    if (inData.market_type === "black")
      return new BlackMarketRateQueryCreator(this.getSanitizedInData(inData));
    return new ParallelMarketRateQueryCreator(this.getSanitizedInData(inData));
  }

  private getSanitizedInData(inData: InData): InData {
    return {
      market_type: this.helper.sanitize(inData.market_type),
      base: this.helper.sanitize(inData.base),
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
        
        ${this.lastItemFromCol(favourites.favourite_at)} > 
        ${this.lastItemFromCol(favourites.unfavourite_at)} 
      )
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
  offset: number;
  limit: number;
  constructor(sanitizedData: InData) {
    this.interval = sanitizedData.interval;
    this.from = sanitizedData.from;
    this.to = sanitizedData.to;
    this.base = sanitizedData.base;
    this.offset = sanitizedData.offset;
    this.limit = sanitizedData.limit;
  }
  getQuery() {
    return `
      SELECT 
      ${t}.${blackRates.quota} as quota,
      array_agg(${t}.${parallelRates.time}) as timestamps,
      array_agg(${t}.${blackRates.rate}) as rates
    FROM  (
      SELECT 
        ${blackRates.quota} as ${blackRates.quota},  
        floor((EXTRACT(EPOCH FROM ${t1}.${blackRates.time}) /${this.interval})) *
          ${this.interval}  AS ${blackRates.time},
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
          ${blackRates.time} DESC
        FETCH FIRST ROW ONLY
      ) ${t2} ON TRUE
      WHERE  
        COALESCE (
          EXTRACT(EPOCH FROM ${t2}.${prev_time}),
          EXTRACT(EPOCH FROM ${t1}.${blackRates.time})
        ) >= ${this.from}  
          AND 
        EXTRACT(EPOCH FROM ${t1}.${blackRates.time}) <= ${this.to} AND
        ${blackRates.base} = ${this.base}
          AND
        ${blackRates.rate} IS NOT NULL
      GROUP BY 
        ${blackRates.quota}, 
        floor((EXTRACT(EPOCH FROM ${t1}.${blackRates.time}) /${this.interval}))
    ) AS ${t}
    GROUP BY 
      ${t}.${blackRates.quota}
    OFFSET ${this.offset}
    FETCH FIRST ${this.limit} ROWS ONLY
    `;
  }
}

class ParallelMarketRateQueryCreator {
  interval: number;
  from: number;
  to: number;
  base: string;
  offset: number;
  limit: number;
  constructor(sanitizedData: InData) {
    this.interval = sanitizedData.interval;
    this.from = sanitizedData.from;
    this.to = sanitizedData.to;
    this.base = sanitizedData.base;
    this.offset = sanitizedData.offset;
    this.limit = sanitizedData.limit;
  }
  getQuery() {
    return `
      SELECT 
        ${t}.${parallelRates.currency_id} as quota,
        array_agg(${t}.${parallelRates.time}) as timestamps,
        array_agg(${t}.${parallelRates.rate}) as rates
      FROM  (
        
      SELECT 
        ${parallelRates.currency_id} as ${parallelRates.currency_id},  
        floor((EXTRACT(EPOCH FROM ${t1}.${parallelRates.time}) /${this.interval})) *
          ${this.interval}  AS ${parallelRates.time},
        AVG(${t1}.${parallelRates.rate}) as ${parallelRates.rate}
      FROM 
        ${parallelRates.$$NAME} AS ${t1}
      LEFT JOIN LATERAL (
          SELECT 
            ${parallelRates.time} AS ${prev_time} 
          FROM
            ${parallelRates.$$NAME}
          WHERE 
            ${parallelRates.currency_id} = ${t1}.${parallelRates.currency_id} AND
            ${t1}.${parallelRates.time} > ${parallelRates.time}
          ORDER BY 
            ${parallelRates.time} DESC
          FETCH FIRST ROW ONLY
        ) ${t2} ON TRUE
      WHERE  
        COALESCE (
          EXTRACT(EPOCH FROM ${t2}.${prev_time}),
          EXTRACT(EPOCH FROM ${t1}.${parallelRates.time})
        ) >= ${this.from}  
          AND 
        EXTRACT(EPOCH FROM ${t1}.${parallelRates.time}) <= ${this.to}
        AND
        ${parallelRates.rate} IS NOT NULL
      GROUP BY 
        ${parallelRates.currency_id}, 
        floor((EXTRACT(EPOCH FROM ${t1}.${parallelRates.time}) /${this.interval}))
      ) AS ${t}
      GROUP BY 
        ${t}.${parallelRates.currency_id}
      OFFSET ${this.offset}
      FETCH FIRST ${this.limit} ROWS ONLY
    `;
  }
}
