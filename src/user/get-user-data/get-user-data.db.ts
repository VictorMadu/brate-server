import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient, QueryResult } from "pg";
import {
  wallet_currency_transactions as transactions,
  sellers,
  blackRates,
  price_alerts,
  parallelRates,
  users,
} from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
  userId: string;
  includeEmail: boolean;
  includePhone: boolean;
  includeName: boolean;
}

interface OutData {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
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

  async getUserData(inData: InData): Promise<OutData | undefined> {
    return await this.runner.runQuery(async (psql) => await this._getUserData(psql, inData));
  }

  async _getUserData(psql: PoolClient, inData: InData): Promise<OutData | undefined> {
    const queryCreator = new GetUserDataQueryCreator({
      userId: this.helper.sanitize(inData.userId),
      includeEmail: this.helper.sanitize(inData.includeEmail),
      includePhone: this.helper.sanitize(inData.includePhone),
      includeName: this.helper.sanitize(inData.includeName),
    });

    const result = await psql.query<OutData>(queryCreator.getQuery());
    return this.helper.getFirstRow(result);
  }
}

class GetUserDataQueryCreator {
  private userId: string;
  private includeEmail: boolean;
  private includeName: boolean;
  private includePhone: boolean;

  constructor(sanitizedInData: InData) {
    this.userId = sanitizedInData.userId;
    this.includeEmail = sanitizedInData.includeEmail;
    this.includeName = sanitizedInData.includeName;
    this.includePhone = sanitizedInData.includePhone;
  }

  getQuery() {
    return `
      SELECT 
        ${users.user_id} AS id,
        ${this.addFieldIfShouldInclude(
          users.email,
          "email",
          this.includeEmail,
          this.includeCommaIfAllCondsMet(this.includePhone, this.includeName)
        )}
        ${this.addFieldIfShouldInclude(
          users.phone,
          "phone",
          this.includePhone,
          this.includeCommaIfAllCondsMet(this.includeName)
        )}
        ${this.addFieldIfShouldInclude(users.name, "name", this.includeName)}
      FROM
      ${users.$$NAME}
      WHERE
        ${users.user_id} = ${this.userId}
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
