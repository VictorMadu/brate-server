import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/wallet.db.service";
import { PoolClient } from "pg";
import { wallet_currency_transactions as transactions } from "../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../utils/postgres-helper";

interface InData {
  userId: string;
  amountToFund: number;
  currencyToFund: string;
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

  async fundUserWallet(inData: InData): Promise<boolean> {
    return (
      (await this.runner.runQuery(async (psql) => {
        const isSuccessful = await this._fundUserWallet(psql, inData);
        if (!isSuccessful) return undefined;
        return true;
      })) || false
    );
  }

  async _fundUserWallet(psql: PoolClient, inData: InData): Promise<boolean> {
    const queryCreator = new FundUserWalletQueryCreator({
      userId: this.helper.sanitize(inData.userId),
      amountToFund: this.helper.sanitize(inData.amountToFund),
      currencyToFund: this.helper.sanitize(inData.currencyToFund),
    });

    console.log("_fundUserWallet query", queryCreator.getQuery());

    try {
      const result = await psql.query(queryCreator.getQuery());
      console.log("_fundUserWallet result", result);
      return result.rowCount != null && result.rowCount > 0;
    } catch (err) {
      console.log("_fundUserWallet err", err);
      throw err;
    }
  }
}

class FundUserWalletQueryCreator {
  private userId: string;
  private amountToFund: number;
  private currencyToFund: string;

  constructor(sanitizedInData: InData) {
    this.userId = sanitizedInData.userId;
    this.amountToFund = sanitizedInData.amountToFund;
    this.currencyToFund = sanitizedInData.currencyToFund;
  }

  getQuery() {
    const a = "__a";
    return `
      INSERT INTO
        ${transactions.$$NAME}
        (
          ${transactions.user_id},
          ${transactions.amount},
          ${transactions.currency_id},
          ${transactions.transaction_with_id}
        )
        VALUES
          (
            ${this.userId},
            ((SELECT ${a} FROM ${this.getLastTransactionAmountQuery(a)}) + ${
      this.amountToFund
    }),
            ${this.currencyToFund},
            ${
              this.userId
            }  -- User funding himself/herself. Having the transaction with himself/herself
          )
    `;
  }

  private getLastTransactionAmountQuery(colName: string) {
    return `
      COALESCE(
        (
          SELECT 
            ${transactions.amount}
          FROM
            ${transactions.$$NAME}
          WHERE
            ${transactions.user_id} = ${this.userId} AND
            ${transactions.currency_id} = ${this.currencyToFund}
          ORDER BY
            ${transactions.created_at} DESC
          FETCH FIRST ROW ONLY
        ),
        0
      ) AS ${colName}
    `;
  }
}
