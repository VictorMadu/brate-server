import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/market.db.service";
import { PoolClient } from "pg";
import {
  blackRates,
  sellers,
  users,
  wallet_currency_transactions as wallet,
} from "../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../utils/postgres-helper";
import { toFloat } from "../../utils/postgres-type-cast";

interface InData {
  userId: string;
  pairs: { base: string; quota: string }[];
  pageOffset: number;
  pageCount: number;
}

interface OutData {
  pair: string;
  rate: number;
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

  async getCurrenciesForSaleData(inData: InData) {
    return (
      (await this.runner.runQuery(
        async (psql) => await this._getCurrenciesForSaleData(psql, inData)
      )) ?? []
    );
  }

  private async _getCurrenciesForSaleData(psql: PoolClient, inData: InData) {
    const queryCreator = new GetCurrenciesForSaleDataQueryCreator(
      this.helper,
      inData
    );
    console.log("_getCurrenciesForSaleData query", queryCreator.getQuery());

    try {
      const result = await psql.query<OutData>(queryCreator.getQuery());
      console.log("_setUserBlackCurrencyRate  result", result);
      return this.helper.getAllRows(result);
    } catch (error) {
      console.log("_setUserBlackCurrencyRate error", error);
      throw error;
    }
  }
}

class GetCurrenciesForSaleDataQueryCreator {
  private userId: string;
  private offset: number;
  private count: number;
  private unSanitizedPairs: { base: string; quota: string }[];
  private b = "_b";
  private s = "_s";
  private w = "_w";
  constructor(private helper: PostgresHeplper, private inData: InData) {
    this.userId = this.helper.sanitize(inData.userId);
    this.offset = this.helper.sanitize(inData.pageOffset);
    this.count = this.helper.sanitize(inData.pageCount);
    this.unSanitizedPairs = inData.pairs;
  }

  getQuery() {
    return `
    SELECT 
      *
    FROM (
      SELECT DISTINCT 
        ON (${this.b}.${blackRates.base}, ${this.b}.${blackRates.quota})
        ${this.b}.${blackRates.base} || ' ' ||  ${this.b}.${
      blackRates.quota
    } AS pair,
        FIRST_VALUE(${toFloat(`${this.b}.${blackRates.rate}`)}) OVER ${
      this.w
    } AS rate 
      FROM 
        ${blackRates.$$NAME} AS ${this.b}
      LEFT JOIN 
        ${sellers.$$NAME} AS ${this.s}
      ON 
        ${this.s}.${sellers.user_id} = ${this.userId}
      WHERE 
        ${this.b}.${blackRates.seller_id} = ${this.s}.${sellers.seller_id} AND
        ${this.createWhereQueryFromPair()}
      WINDOW ${this.w} AS (PARTITION BY ${this.b}.${blackRates.base}, ${
      this.b
    }.${blackRates.quota} ORDER BY ${this.b}.${blackRates.time} DESC)
    ) AS ____q
    WHERE rate IS NOT NULL
    OFFSET ${this.offset}
    FETCH FIRST ${this.count} ROWS ONLY;
    `;
  }

  private createWhereQueryFromPair() {
    if (this.isUnSanitizedPairsArrEmpty()) return `TRUE`;

    let queryBuilder = "";
    for (let i = 0; i < this.unSanitizedPairs.length; i++) {
      const {
        base: unSanitizedBase,
        quota: unSanitizedQuota,
      } = this.unSanitizedPairs[i];

      const base = this.helper.sanitize(unSanitizedBase);
      const quota = this.helper.sanitize(unSanitizedQuota);

      queryBuilder += `(${this.b}.${blackRates.base} = ${base} AND ${this.b}.${blackRates.quota} = ${quota}) OR`;
    }

    return this.removeLastTrailiingORAndSpaceFrom(queryBuilder);
  }

  private removeLastTrailiingORAndSpaceFrom(queryBuilder: string) {
    const positionToStartToRemove = 3; // ' OR' => 3
    return queryBuilder.slice(0, -positionToStartToRemove);
  }

  private isUnSanitizedPairsArrEmpty() {
    return this.unSanitizedPairs.length === 0;
  }
}
