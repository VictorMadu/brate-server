import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { web_clients } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
  userId: string;
  include_web_client_id: boolean;
  include_language: boolean;
  include_remove_trade_notification_after: boolean;
  include_remove_price_alert_notification_after: boolean;
  include_remove_fund_notification_after: boolean;
  include_bereau_de_change: boolean;
  include_dark_mode: boolean;
}

interface OutData {
  user_id: string;
  web_client_id?: string;
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

  async getUserWebData(inData: InData): Promise<OutData | undefined> {
    return await this.runner.runQuery(async (psql) => await this._getUserWebData(psql, inData));
  }

  async _getUserWebData(psql: PoolClient, inData: InData): Promise<OutData | undefined> {
    const queryCreator = new GetUserDataQueryCreator({
      userId: this.helper.sanitize(inData.userId),
      include_web_client_id: this.helper.sanitize(inData.include_web_client_id),
      include_language: this.helper.sanitize(inData.include_language),
      include_remove_trade_notification_after: this.helper.sanitize(
        inData.include_remove_trade_notification_after
      ),
      include_remove_price_alert_notification_after: this.helper.sanitize(
        inData.include_remove_price_alert_notification_after
      ),
      include_remove_fund_notification_after: this.helper.sanitize(
        inData.include_remove_fund_notification_after
      ),
      include_bereau_de_change: this.helper.sanitize(inData.include_bereau_de_change),
      include_dark_mode: this.helper.sanitize(inData.include_dark_mode),
    });

    const result = await psql.query<OutData>(queryCreator.getQuery());
    return this.helper.getFirstRow(result);
  }
}

class GetUserDataQueryCreator {
  private userId: string;
  private include_web_client_id: boolean;
  private include_language: boolean;
  private include_remove_trade_notification_after: boolean;
  private include_remove_price_alert_notification_after: boolean;
  private include_remove_fund_notification_after: boolean;
  private include_bereau_de_change: boolean;
  private include_dark_mode: boolean;

  constructor(sanitizedInData: InData) {
    this.userId = sanitizedInData.userId;
    this.include_web_client_id = sanitizedInData.include_web_client_id;
    this.include_language = sanitizedInData.include_language;
    this.include_remove_trade_notification_after =
      sanitizedInData.include_remove_trade_notification_after;
    this.include_remove_price_alert_notification_after =
      sanitizedInData.include_remove_price_alert_notification_after;
    this.include_remove_fund_notification_after =
      sanitizedInData.include_remove_fund_notification_after;
    this.include_bereau_de_change = sanitizedInData.include_bereau_de_change;
    this.include_dark_mode = sanitizedInData.include_dark_mode;
  }

  // WARNING: We expect at least one not null
  getQuery() {
    return `
      SELECT 
        ${web_clients.user_id} AS user_id,

        ${this.addFieldIfShouldInclude(
          web_clients.web_client_id,
          "web_client_id",
          this.include_web_client_id,
          this.includeCommaIfAllCondsMet(
            this.include_language,
            this.include_remove_trade_notification_after,
            this.include_remove_price_alert_notification_after,
            this.include_remove_fund_notification_after,
            this.include_bereau_de_change,
            this.include_dark_mode
          )
        )}

        ${this.addFieldIfShouldInclude(
          web_clients.language,
          "language",
          this.include_language,
          this.includeCommaIfAllCondsMet(
            this.include_remove_trade_notification_after,
            this.include_remove_price_alert_notification_after,
            this.include_remove_fund_notification_after,
            this.include_bereau_de_change,
            this.include_dark_mode
          )
        )}

        ${this.addFieldIfShouldInclude(
          web_clients.remove_trade_notification_after,
          "remove_trade_notification_after",
          this.include_remove_trade_notification_after,
          this.includeCommaIfAllCondsMet(
            this.include_remove_price_alert_notification_after,
            this.include_remove_fund_notification_after,
            this.include_bereau_de_change,
            this.include_dark_mode
          )
        )}

         ${this.addFieldIfShouldInclude(
           web_clients.remove_price_alert_notification_after,
           "remove_price_alert_notification_after",
           this.include_remove_price_alert_notification_after,
           this.includeCommaIfAllCondsMet(
             this.include_remove_fund_notification_after,
             this.include_bereau_de_change,
             this.include_dark_mode
           )
         )}

        ${this.addFieldIfShouldInclude(
          web_clients.remove_fund_notification_after,
          "remove_fund_notification_after",
          this.include_remove_fund_notification_after,
          this.includeCommaIfAllCondsMet(this.include_bereau_de_change, this.include_dark_mode)
        )}

        ${this.addFieldIfShouldInclude(
          web_clients.bereau_de_change,
          "bereau_de_change",
          this.include_bereau_de_change,
          this.includeCommaIfAllCondsMet(this.include_dark_mode)
        )}

         ${this.addFieldIfShouldInclude(web_clients.dark_mode, "dark_mode", this.include_dark_mode)}
      FROM
      ${web_clients.$$NAME}
      WHERE
        ${web_clients.user_id} = ${this.userId}
    `;
  }

  private includeCommaIfAllCondsMet(...conds: boolean[]) {
    let i = 0;
    const lenConds = conds.length;
    while (i < lenConds) {
      const isFalsyCond = !conds[i];
      if (isFalsyCond) return "";
      i++;
    }
    return ",";
  }

  private addFieldIfShouldInclude(
    col: string,
    colName: string,
    shouldInclude: boolean,
    seperator = ""
  ) {
    if (!shouldInclude) return "";
    return `${col} AS ${colName}${seperator}`;
  }
}
