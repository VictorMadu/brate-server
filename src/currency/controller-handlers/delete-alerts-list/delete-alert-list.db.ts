import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { PoolClient } from "pg";
import { price_alerts } from "../../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../../utils/postgres-helper";

export type InData = {
  ids: string[];
  userId: string;
};

const table = price_alerts;

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

  async query(inData: InData): Promise<number> {
    return (
      (await this.runner.runQuery(
        async (psql) => await this.runQuery(psql, inData)
      )) ?? 0
    );
  }

  async runQuery(psql: PoolClient, inData: InData) {
    const queryCreator = new DeleteAlertListQueryCreator({
      userId: this.helper.sanitize(inData.userId),
      alertsTodeleteIds: this.helper.sanitize(inData.ids),
    });
    console.log("runQuery query", queryCreator.getQuery());
    try {
      const result = await psql.query(queryCreator.getQuery());
      console.log("runQuery result", result);
      return this.helper.getAlteredRowLenth(result);
    } catch (error) {
      console.log("runQuery error", error);
      throw error;
    }
  }
}

class DeleteAlertListQueryCreator {
  private userId: string;
  private alertsTodeleteIds: string;
  constructor(sanitizedData: { userId: string; alertsTodeleteIds: string }) {
    this.userId = sanitizedData.userId;
    this.alertsTodeleteIds = sanitizedData.alertsTodeleteIds;
  }

  getQuery() {
    return `
    UPDATE
      ${table.$$NAME}
    SET 
      ${table.deleted_at} = NOW()
    WHERE
      ${table.user_id} = ${this.userId} AND
      ${table.deleted_at} IS NULL AND
      ${table.price_alert_id} IN (${this.alertsTodeleteIds})`;
  }
}
