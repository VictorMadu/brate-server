import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/wallet.db.service";
import { PoolClient } from "pg";
import { wallet_currency_transactions as transactions } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
    userId: string;
    amountToWithdraw: number;
    currencyToWithdraw: string;
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

    async withdrawFromUserWallet(inData: InData): Promise<boolean> {
        return !!(await this.runner.runQuery((psql) => this._withdrawFromUserWallet(psql, inData)));
    }

    async _withdrawFromUserWallet(psql: PoolClient, inData: InData): Promise<boolean> {
        const queryCreator = new WithdrawFromUserWalletQueryCreator({
            userId: this.helper.sanitize(inData.userId),
            amountToWithdraw: this.helper.sanitize(inData.amountToWithdraw),
            currencyToWithdraw: this.helper.sanitize(inData.currencyToWithdraw),
        });

        console.log("_withdrawFromUserWallet query", queryCreator.getQuery());
        const result = await psql.query(queryCreator.getQuery());
        return result.rowCount != null && result.rowCount > 0;
    }
}
// TODO: If user tries to withdraw with currency that does not exist or has no amount (0), throw error

class WithdrawFromUserWalletQueryCreator {
    private userId: string;
    private amountToWithdraw: number;
    private currencyToWithdraw: string;

    constructor(sanitizedInData: InData) {
        this.userId = sanitizedInData.userId;
        this.amountToWithdraw = sanitizedInData.amountToWithdraw;
        this.currencyToWithdraw = sanitizedInData.currencyToWithdraw;
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
        SELECT
          (
            ${this.userId},
            ${this.getNewAmountQuery(a)},
            ${this.currencyToWithdraw},
            ${this.userId}  -- User having the transaction with self
          )
        WHERE 
          ${this.getNewAmountQuery(a)} >= 0      
    `;
    }

    // TODO: Add check for transaction to ensure amount is not less than 0 instead of doing this
    private getNewAmountQuery(colName: string) {
        return `((SELECT ${colName} FROM ${this.getLastTransactionAmountQuery(colName)}) - ${
            this.amountToWithdraw
        })`;
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
            ${transactions.currency_id} = ${this.currencyToWithdraw}
          ORDER BY
            ${transactions.created_at} DESC
          FETCH FIRST ROW ONLY
        ),
        0
      ) AS ${colName}
    `;
    }
}
