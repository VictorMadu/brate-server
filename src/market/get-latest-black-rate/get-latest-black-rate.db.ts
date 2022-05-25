import { PostgresDbService } from "../_utils/market.db.service";
import { Injectable } from "nist-core/injectables";
import { PoolClient } from "pg";
import {
  blackRates,
  user_favourite_currency_pairs,
} from "../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../utils/postgres-helper";
import { toBoolean, toFloat, toString } from "../../utils/postgres-type-cast";

const t1 = "__t1";
const t2 = "__t2";
const t3 = "__t3";
const w = "__w";
const prev_rate = "__prev_rate";

interface InData {
  userId?: string;
  bases: string[];
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
    return await this.runner.runQuery(
      async (psql) => await this._getLatestRate(psql, inData)
    );
  }

  async _getLatestRate(
    psql: PoolClient,
    inData: InData
  ): Promise<OutData[] | undefined> {
    try {
      const queryCreator = new GetLastestBlackRateQueryCreator(
        this.helper,
        inData
      );
      console.log("_getLatestBlackRate query", queryCreator.getQuery());
      const result = await psql.query<OutData>(queryCreator.getQuery());
      console.log("_getLatestBlackRate result", result);
      return this.helper.getAllRows(result);
    } catch (error) {
      console.log("_getLatestBlackRate error", error);
      throw error;
    }
  }

  async getTotal(inData: Omit<InData, "pageOffset" | "pageCount">) {
    return await this.runner.runQuery(
      async (psql) => await this._getTotal(psql, inData)
    );
  }

  async _getTotal(
    psql: PoolClient,
    inData: Omit<InData, "pageOffset" | "pageCount">
  ) {
    const queryCreator = new GetLastestBlackRateQueryCreator(this.helper, {
      ...inData,
      pageCount: 0,
      pageOffset: Number.POSITIVE_INFINITY,
    });
    const result = await psql.query<{ count: number }>(
      queryCreator.getCountQuery()
    );
    return this.helper.getFromFirstRow(result, "count");
  }
}

// TODO: Split using state pattern
class FavouriteQuery {
  constructor(
    private sanitizedUserId: string | undefined,
    private filter: "all" | "favourite" | "unfavourite"
  ) {}

  getQuery(baseQuery: string, quotaQuery: string) {
    if (!this.sanitizedUserId) return "";
    const {
      $$NAME,
      base,
      quota,
      user_id,
      favourite_at,
      unfavourite_at,
    } = user_favourite_currency_pairs;
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

  // getWhereQuery( baseQuery: string, quotaQuery: string) {
  //   if (this.filter === "all") return "TRUE";
  //   const query = this.getQuery( baseQuery, quotaQuery);
  //   if (!query) return "TRUE";
  //   return `${query} = ${this.getFavouriteBool(this.filter)}`;
  // }

  private getFavouriteBool(filter: "favourite" | "unfavourite") {
    if (filter === "favourite") return `TRUE`;
    return "FALSE";
  }

  private lastArrayItemOfColQuery(colName: string) {
    return `${colName}[array_length(${colName}, 1)]`;
  }

  private firstArrayItemOfColQuery(colName: string) {
    return `${colName}[1]`;
  }
}
class GetLastestBlackRateQueryCreator {
  private userId: string | undefined;
  private offset: number;
  private count: number;
  private whereInBases: string;
  private favouriteQuery: FavouriteQuery;
  constructor(helper: PostgresHeplper, inData: InData) {
    this.userId = helper.sanitize(inData.userId);
    this.offset = helper.sanitize(inData.pageOffset);
    this.count = helper.sanitize(inData.pageCount);
    this.whereInBases = this.getWhereInBasesQuery(
      helper.sanitize(inData.bases)
    );
    this.favouriteQuery = new FavouriteQuery(this.userId, inData.filter);

    console.log("Black bases", inData.bases);
    console.log("Black bases sanitized", helper.sanitize(inData.bases));
  }

  getCountQuery() {
    return `SELECT COUNT(${this.getQuery()}) AS count`;
  }

  getQuery() {
    const { $$NAME, seller_id, base, quota, rate, time } = blackRates;
    return `
    WITH ${t1} AS (
      SELECT DISTINCT 
        ON(${seller_id}, ${base}, ${quota})
        ${seller_id},
        ${base}, 
        ${quota},
        FIRST_VALUE(${rate}) OVER ${w} AS ${rate},
        FIRST_VALUE(${time}) OVER ${w} AS ${time}
      FROM 
        ${$$NAME}
      WHERE ${this.whereInBases}
      WINDOW ${w} AS (PARTITION BY ${seller_id}, ${base}, ${quota} ORDER BY ${time} DESC)
    )
    
    SELECT DISTINCT
      ON (${t1}.${base}, ${t1}.${quota})
      ${toString(this.pairSelect())} AS pair,
      ${toBoolean(this.favouriteSelect())} AS is_favourite,
      ${toFloat(this.rateSelect())} AS rate,
      ${toFloat(this.prevRateSelect())} AS prev_rate
    FROM ${t1} 
    LEFT JOIN LATERAL (
      SELECT 
          ${rate} AS ${prev_rate}
        FROM 
          ${$$NAME}
        WHERE 
          ${seller_id} = ${t1}.${seller_id} AND 
          ${base} = ${t1}.${base} AND 
          ${quota} = ${t1}.${quota} AND 
          ${time} < ${t1}.${time} 
        ORDER BY 
          ${time} DESC 
        FETCH FIRST ROW ONLY
    ) AS ${t2}
    ON TRUE
    WINDOW ${w} AS (PARTITION BY ${t1}.${base}, ${t1}.${quota})
    OFFSET ${this.offset}
    FETCH FIRST ${this.count} ROWS ONLY
    `;
  }

  private pairSelect() {
    const base = blackRates.base;
    const quota = blackRates.quota;
    return `${t1}.${base} || ' ' || ${t1}.${quota} `;
  }

  private favouriteSelect() {
    const base = blackRates.base;
    const quota = blackRates.quota;
    return ` ${this.favouriteQuery.getQuery(
      `${t1}.${base}`,
      `${t1}.${quota}`
    )}`;
  }

  private rateSelect() {
    const rate = blackRates.rate;
    return `AVG (${t1}.${rate}) OVER ${w}`;
  }

  private prevRateSelect() {
    const rate = blackRates.rate;
    return `AVG (COALESCE(${t2}.${prev_rate}, ${t1}.${rate})) OVER ${w}`;
  }

  private getWhereInBasesQuery(bases: string) {
    const { base } = blackRates;
    if (!bases) return "TRUE";
    return `${base} IN (${bases})`;
  }
}
