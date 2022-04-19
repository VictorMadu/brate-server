import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { InData, OutData, Response } from "./interface";
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
      DELETE FROM 
        ${table.$$NAME}
      WHERE
        ${table.price_alert_id} = (${inData.toString()})   
    `);

    return result.rowCount;
  }
}
