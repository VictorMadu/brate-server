import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { InData, OutData } from "./interface";
import { PoolClient } from "pg";
import { price_alerts } from "../../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../../utils/postgres-helper";
import {
  timestampToFloat,
  toFloat,
  toString,
} from "../../../utils/postgres-type-cast";

const table = price_alerts;

// TODO: All successfully and non-successfully (error response eg: > 299 or 399 i think) should return a constant number indicating the cause. Eg: const EXPIRED_TOKEN = 1
@Injectable()
export class GetAlertListDbService {
  constructor(
    private currencyDb: CurrencyPostgresDbService,
    private helper: PostgresHeplper,
    private runner: PostgresPoolClientRunner
  ) {}

  private onReady() {
    this.runner.setPsql(this.currencyDb.getPsql());
  }

  async getPriceAlerts(inData: InData): Promise<OutData[]> {
    return (
      (await this.runner.runQuery(
        async (psql) => await this._getPriceAlerts(psql, inData)
      )) ?? []
    );
  }

  async _getPriceAlerts(psql: PoolClient, inData: InData): Promise<OutData[]> {
    const queryCreator = new GetPriceAlertsQueryCreator(
      {
        userId: this.helper.sanitize(inData.userId),
        offset: this.helper.sanitize(inData.offset),
        limit: this.helper.sanitize(inData.limit),
      },
      {
        market: inData.market_type,
        filter: inData.filter,
      }
    );
    console.log("_getPriceAlerts query", queryCreator.getQuery());
    try {
      const result = await psql.query<OutData>(queryCreator.getQuery());
      console.log("_getPriceAlerts result", result);
      return this.helper.getAllRows(result);
    } catch (error) {
      console.log("_getPriceAlerts error", error);
      throw error;
    }
  }
}

// TODO: SERIOUS ISSUE: ensure all the data type returned from query is correct
// TODO: SERIOUS ISSUE: better sanitization of input data.
class GetPriceAlertsQueryCreator {
  private userId: string;
  private offset: number;
  private limit: number;
  constructor(
    sanitizedInData: { userId: string; offset: number; limit: number },
    private config: {
      market: "parallel" | "black";
      filter: "all" | "untriggered" | "triggered";
    }
  ) {
    this.userId = sanitizedInData.userId;
    this.offset = sanitizedInData.offset;
    this.limit = sanitizedInData.limit;
  }

  getQuery() {
    return ` 
    SELECT 
      ${toString(table.price_alert_id)} as id,
      ${toString(table.base)} as base,
      ${toString(table.quota)} as quota,
      ${toFloat(table.target_rate)} as target_rate,
      ${toFloat(table.set_rate)} as created_rate,
      ${timestampToFloat(table.created_at)} as created_at,
      ${timestampToFloat(table.triggered_at)} as triggered_at
    FROM 
      ${table.$$NAME}
    WHERE 
      ${table.user_id} = ${this.userId} AND
      ${table.market_type} = ${this.getMarketType()} AND 
      ${table.deleted_at} IS NULL AND
      ${this.getFilterQuery()}
    OFFSET
      ${this.offset}
    FETCH FIRST ${this.limit} ROWS ONLY
    `;
  }

  private getMarketType() {
    if (this.config.market === "black") return `'B'`;
    return `'P'`;
  }

  private getFilterQuery() {
    const filter = this.config.filter;
    if (filter === "untriggered") return `${table.triggered_at} IS NULL`;
    if (filter === "triggered") return `${table.triggered_at} IS NOT NULL`;
    return `TRUE`;
  }
}
