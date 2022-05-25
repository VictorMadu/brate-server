import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/wallet.db.service";
import { PoolClient } from "pg";
import { wallet_currency_transactions as transactions } from "../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../utils/postgres-helper";
import { toFloat, toString } from "../../utils/postgres-type-cast";

const table = transactions;

interface InData {
  userId: string;
  currencies: string[];
  pageOffset: number;
  pageCount: number;
}

interface OutData {
  currency: string;
  amount: number;
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

  async getWalletAmountData(inData: InData) {
    return await this.runner.runQuery(
      async (psql) => await this._getWalletAmountData(psql, inData)
    );
  }

  private async _getWalletAmountData(psql: PoolClient, inData: InData) {
    const queryCreator = new GetWalletAmountDataQueryCreator(
      this.helper,
      inData
    );
    const result = await psql.query<{ currency: string; amount: number }>(
      queryCreator.getQuery()
    );
    return this.helper.getAllRows(result);
  }
}

class GetWalletAmountDataQueryCreator {
  constructor(private helper: PostgresHeplper, private inData: InData) {}
  getQuery() {
    return `
    SELECT DISTINCT
      ON (${transactions.currency_id})
      ${toString(transactions.currency_id)} AS currency,
      FIRST_VALUE(${toFloat(transactions.amount)}) OVER w AS amount
    FROM
      ${transactions.$$NAME}
    WHERE
      ${transactions.user_id} = ${this.helper.sanitize(this.inData.userId)} AND
      ${this.createWhereQueryForSelectSpecificCurrencies()}
    WINDOW w AS (
      PARTITION BY ${transactions.currency_id}
      ORDER BY ${table.created_at} DESC
    )
    OFFSET ${this.inData.pageOffset}
    FETCH FIRST ${this.inData.pageCount} ROWS ONLY
    `;
  }

  private createWhereQueryForSelectSpecificCurrencies() {
    const currencies = this.inData.currencies;
    if (currencies.length === 0) return "TRUE";
    else
      return `${transactions.currency_id} IN (${this.helper.sanitize(
        currencies
      )})`;
  }
}
