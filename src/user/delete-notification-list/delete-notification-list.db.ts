import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../../currency/controller-handlers/_utils/currency.db.service";
import { PoolClient } from "pg";
import { notifications } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

const table = notifications;

interface InData {
  userId: string;
  ids: string[];
}

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

  async deleteUserNotifications(inData: InData): Promise<number> {
    return (
      (await this.runner.runQuery(
        async (psql) => await this.setNotificationsToDeleteDeleteAtFieldToNow(psql, inData)
      )) ?? 0
    );
  }

  private async setNotificationsToDeleteDeleteAtFieldToNow(psql: PoolClient, inData: InData) {
    const result = await psql.query(`
    UPDATE
      ${table.$$NAME}
    SET
      ${table.deleted_at} = NOW()
    WHERE
      ${table.user_id} = ${this.helper.sanitize(inData.userId)} AND
      ${table.notification_id} IN (${this.helper.sanitize(inData.ids)}) AND 
      ${table.deleted_at} IS NULL
  `);

    return result.rowCount;
  }
}
