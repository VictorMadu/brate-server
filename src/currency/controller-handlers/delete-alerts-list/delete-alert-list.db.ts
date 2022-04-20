import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { InData } from "./interface";
import { PoolClient } from "pg";
import { price_alerts } from "../../../utils/postgres-db-types/erate";
import { PostgresHeplper } from "../../../utils/postgres-helper";

const table = price_alerts;

@Injectable()
export class DbService {
  psql!: PoolClient;
  constructor(private currencyDb: CurrencyPostgresDbService, private helper: PostgresHeplper) {}

  private onReady() {
    this.psql = this.currencyDb.getPsql();
  }

  async query(inData: InData): Promise<number> {
    const result = await this.psql.query(`
      UPDATE
        ${table.$$NAME}
      SET 
        ${table.deleted_at} = NOW()
      WHERE
        ${
          table.price_alert_id
        } = (${inData.toString()})    // TODO: use the dollar sign interpolator and array of values provided by pg
    `);

    await this.psql.release();
    return result.rowCount;
  }
}
