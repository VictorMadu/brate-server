import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { web_clients } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
  userId: string;
  language?: "English" | "French";
  remove_trade_notification_after?: number;
  remove_price_alert_notification_after?: number;
  remove_fund_notification_after?: number;
  bereau_de_change?: boolean;
  dark_mode?: boolean;
}

@Injectable()
export class DbService {
  constructor(
    private currencyDb: PostgresDbService,
    private helper: PostgresHeplper,
    private runner: PostgresPoolClientRunner
  ) {}

  private onReady() {
    this.runner.setPsql(this.currencyDb.getPsql());
  }

  async editUserWebData(inData: InData): Promise<boolean> {
    return (
      (await this.runner.runQuery(async (psql) => {
        const isSuccessful = await this._editUserWebData(psql, inData);
        if (!isSuccessful) return undefined;
        return true;
      })) || false
    );
  }

  async _editUserWebData(psql: PoolClient, inData: InData): Promise<boolean> {
    const queryCreator = new EditUserDataQueryCreator({
      userId: this.helper.sanitize(inData.userId),
      language: this.helper.sanitize(inData.language),
      remove_trade_notification_after: this.helper.sanitize(inData.remove_trade_notification_after),
      remove_price_alert_notification_after: this.helper.sanitize(
        inData.remove_price_alert_notification_after
      ),
      remove_fund_notification_after: this.helper.sanitize(inData.remove_fund_notification_after),
      bereau_de_change: this.helper.sanitize(inData.bereau_de_change),
      dark_mode: this.helper.sanitize(inData.dark_mode),
    });

    const result = await psql.query(queryCreator.getQuery());
    return result.rowCount != null && result.rowCount > 0;
  }
}

class EditUserDataQueryCreator {
  private userId: string;
  private language: "English" | "French" | undefined;
  private remove_trade_notification_after: number | undefined;
  private remove_price_alert_notification_after: number | undefined;
  private remove_fund_notification_after: number | undefined;
  private bereau_de_change: boolean | undefined;
  private dark_mode: boolean | undefined;

  constructor(sanitizedInData: InData) {
    this.userId = sanitizedInData.userId;
    this.language = sanitizedInData.language;
    this.remove_trade_notification_after = sanitizedInData.remove_trade_notification_after;
    this.remove_price_alert_notification_after =
      sanitizedInData.remove_price_alert_notification_after;
    this.remove_fund_notification_after = sanitizedInData.remove_fund_notification_after;
    this.bereau_de_change = sanitizedInData.bereau_de_change;
    this.dark_mode = sanitizedInData.dark_mode;
  }

  getQuery() {
    if (this.isAllNull()) return ``;
    return `
      UPDATE
        ${web_clients.$$NAME}
      SET
        ${this.createColSetQuery(web_clients.user_id, this.userId)},
        ${this.createColSetQuery(web_clients.language, this.language)},
        ${this.createColSetQuery(
          web_clients.remove_trade_notification_after,
          this.remove_trade_notification_after
        )},
        ${this.createColSetQuery(
          web_clients.remove_price_alert_notification_after,
          this.remove_price_alert_notification_after
        )},
        ${this.createColSetQuery(
          web_clients.remove_fund_notification_after,
          this.remove_fund_notification_after
        )},
        ${this.createColSetQuery(web_clients.bereau_de_change, this.bereau_de_change)},
        ${this.createColSetQuery(web_clients.dark_mode, this.dark_mode)}
      WHERE
        ${web_clients.user_id} = ${this.userId}
    `;
  }

  private isAllNull() {
    if (!this.isNull(this.userId)) return false;
    if (!this.isNull(this.language)) return false;
    if (!this.isNull(this.remove_trade_notification_after)) return false;
    if (!this.isNull(this.remove_price_alert_notification_after)) return false;
    if (!this.isNull(this.remove_fund_notification_after)) return false;
    if (!this.isNull(this.bereau_de_change)) return false;
    if (!this.isNull(this.dark_mode)) return false;

    return true;
  }

  private isNull(obj: any) {
    return obj == null;
  }

  private createColSetQuery(colName: string, newData: string | number | boolean | undefined) {
    if (newData == null) return `${colName} = ${colName}`;
    return `${colName} = ${newData}`;
  }
}
