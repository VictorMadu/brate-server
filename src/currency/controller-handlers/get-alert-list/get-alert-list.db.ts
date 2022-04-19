import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { InData, OutData, Response } from "./interface";
import { PoolClient } from "pg";
import { price_alerts } from "../../../utils/postgres-db-types/erate";
import { PostgresHeplper } from "../../../utils/postgres-helper";

const table = price_alerts;

@Injectable()
export class GetAlertListDbService {
  psql!: PoolClient;
  constructor(private currencyDb: CurrencyPostgresDbService, private helper: PostgresHeplper) {}

  private onReady() {
    this.psql = this.currencyDb.getPsql();
  }

  async getPriceAlerts(inData: InData): Promise<OutData[]> {
    const result = await this.psql.query<OutData>(`
      SELECT 
        ${table.price_alert_id} as id,
        ${table.base} as base,
        ${table.quota} as quota,
        ${table.target_rate} as target_rate,
        ${table.set_rate} as created_rate,
        ${table.created_at} as created_at,
        ${table.triggered_at} as "triggered_at
      WHERE 
        ${table.user_id} = '${this.helper.sanitizeStr(inData.userId)}' AND
        ${table.market_type} = '${this.getMarketType(inData.market_type)}' AND 
        ${table.is_deleted} = 'f' AND
        ${this.getFilterQuery(inData.filter)}
      OFFSET
        ${inData.offset}
      FETCH FIRST ${inData.limit} ROWS ONLY
        
    `);

    return result.rows;
  }

  private getMarketType(market: "parallel" | "black") {
    if (market === "black") return "b";
    return "p";
  }

  private getFilterQuery(filter: "all" | "untriggered" | "triggered") {
    if (filter === "untriggered") return `${table.triggered_at} IS NULL`;
    if (filter === "triggered") return `${table.triggered_at} IS NOT NULL`;
    return `TRUE`;
  }
}
