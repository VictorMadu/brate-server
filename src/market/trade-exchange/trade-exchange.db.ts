import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/market.db.service";
import { PoolClient, QueryResult } from "pg";
import {
    wallet_currency_transactions as transactions,
    sellers,
    blackRates,
    users,
} from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import { result } from "lodash";

interface InData {
    buyerUserId: string;
    currencySend: string;
    currencyReceive: string;
    amountSend: number;
    sellerId: string;
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

    async buyCurrencyFromSeller(inData: InData): Promise<boolean | undefined> {
        return this.runner.runQuery((psql) => this._getPriceAlerts(psql, inData));
    }

    // buyer gives base to seller
    // seller gives quota to buyer
    async _getPriceAlerts(psql: PoolClient, inData: InData): Promise<boolean> {
        const transactionHandler = new TransferTransactionHandler(psql, this.helper, {
            buyerUserId: this.helper.sanitize(inData.buyerUserId),
            currencySend: this.helper.sanitize(inData.currencySend),
            currencyReceive: this.helper.sanitize(inData.currencyReceive),
            amountSend: this.helper.sanitize(inData.amountSend),
            sellerId: this.helper.sanitize(inData.sellerId),
        });

        const isSuccessful = await transactionHandler.run();
        return isSuccessful;
    }
}

// TODO: Needs refactoring
// TODO: Have a transaction audit db
class TransferTransactionHandler {
    private buyerUserId: string;
    private baseCurrency: string;
    private quotaCurrency: string;
    private amountSend: number;
    private sellerId: string;

    constructor(
        private psql: PoolClient,
        private helper: PostgresHeplper,
        sanitizedInData: InData
    ) {
        this.buyerUserId = sanitizedInData.buyerUserId;
        this.baseCurrency = sanitizedInData.currencySend;
        this.quotaCurrency = sanitizedInData.currencyReceive;
        this.amountSend = sanitizedInData.amountSend;
        this.sellerId = sanitizedInData.sellerId;
    }

    async run() {
        console.log("TransferTransactionHandler query", this.getRunQuery());
        const result = await this.psql.query<{ amount: number }>(this.getRunQuery());
        return this.helper.hasAlteredTable(result);
    }

    private getRunQuery() {
        const lastBuyerBaseTransact = "__a";
        const lastBuyerQuotaTransact = "__b";
        const lastSellerBaseTransact = "__c";
        const lastSellerQuotaTransact = "__d";
        const sellerRate = "__e";
        const sellerUserIdQuery = "__f";
        const sellerUserIdName = "__g";
        const transactionValues = "__h";
        return `
      WITH ${sellerUserIdQuery} AS (${this.createSellerUserIdQuery(sellerUserIdName)}),
      ${lastBuyerBaseTransact} AS (${this.createBuyerLastBaseCurrencyTransactQuery()}),
      ${lastBuyerQuotaTransact} AS (${this.createBuyerLastQuotaCurrencyTransactQuery()}),
      ${lastSellerBaseTransact} AS (${this.createSellerLastBaseCurrencyTransactQuery(
            `SELECT ${sellerUserIdName} FROM ${sellerUserIdQuery}`
        )}),
     ${lastSellerQuotaTransact} AS (${this.createSellerLastQuotaCurrencyTransactQuery(
            `SELECT ${sellerUserIdName} FROM ${sellerUserIdQuery}`
        )}),
      ${sellerRate} AS (${this.createGetSellerBlackRateFromUserId()})

      INSERT INTO
        ${transactions.$$NAME}
        (
          ${transactions.user_id},
          ${transactions.amount},
          ${transactions.currency_id},
          ${transactions.transaction_with_id}
        )
      
      SELECT *
      FROM (
        VALUES
          -- Remove base from buyer (To send to seller)
          (
            (SELECT ${transactions.user_id} FROM ${lastBuyerBaseTransact}),
            (SELECT ${transactions.amount} FROM ${lastBuyerBaseTransact})  - ${this.amountSend},
            (SELECT ${transactions.currency_id} FROM ${lastBuyerBaseTransact}),
            (SELECT ${sellerUserIdName} FROM ${sellerUserIdQuery})
          ),

          -- Send base from buyer to seller
          (
            (SELECT ${transactions.user_id} FROM ${lastSellerBaseTransact}),
            (SELECT ${transactions.amount} FROM ${lastSellerBaseTransact})  + ${this.amountSend},
            (SELECT ${transactions.currency_id} FROM ${lastSellerBaseTransact}),
            ${this.buyerUserId}
          ),

          -- Remove quota from seller (To send to buyer)
          (
            (SELECT ${transactions.user_id} FROM ${lastSellerQuotaTransact}),
            (SELECT ${transactions.amount} FROM ${lastSellerQuotaTransact}) - ${
            this.amountSend
        } * (SELECT ${blackRates.rate} FROM ${sellerRate}),
            (SELECT ${transactions.currency_id} FROM ${lastSellerQuotaTransact}),
            ${this.buyerUserId}
          ),

          -- Send quota from buyer to seller
          (
            (SELECT ${transactions.user_id} FROM ${lastBuyerQuotaTransact}),
            (SELECT ${transactions.amount} FROM ${lastBuyerQuotaTransact}) + ${
            this.amountSend
        } * (SELECT ${blackRates.rate} FROM ${sellerRate}),
            (SELECT ${transactions.currency_id} FROM ${lastBuyerQuotaTransact}),
            (SELECT ${sellerUserIdName} FROM ${sellerUserIdQuery})
          )
        ) AS ${transactionValues}
      WHERE
        EXISTS (SELECT * FROM ${sellerUserIdQuery}) AND
        EXISTS (SELECT * FROM ${lastBuyerBaseTransact}) AND
        EXISTS (SELECT * FROM ${lastBuyerQuotaTransact}) AND
        EXISTS (SELECT * FROM ${lastSellerBaseTransact}) AND
        EXISTS (SELECT * FROM ${lastSellerQuotaTransact}) AND
        EXISTS (SELECT * FROM ${sellerRate}) AND
        ${this.amountSend} > 0
    `;
    }

    private createBuyerLastBaseCurrencyTransactQuery() {
        return this.createGetLastTransactQueryForUser(this.buyerUserId, this.baseCurrency);
    }

    private createBuyerLastQuotaCurrencyTransactQuery() {
        return this.createGetLastTransactQueryForUser(this.buyerUserId, this.quotaCurrency);
    }

    private createSellerLastBaseCurrencyTransactQuery(sellerUserIdQuery: string) {
        return this.createGetLastTransactQueryForUser(sellerUserIdQuery, this.baseCurrency);
    }

    private createSellerLastQuotaCurrencyTransactQuery(sellerUserIdQuery: string) {
        return this.createGetLastTransactQueryForUser(sellerUserIdQuery, this.quotaCurrency);
    }

    private createGetLastTransactQueryForUser(userIdQuery: string, currencyIdQuery: string) {
        const t = "__t";
        return `
      WITH ${t} AS (
        SELECT 
          (${transactions.user_id})::uuid AS ${transactions.user_id},
          (${transactions.currency_id}) AS ${transactions.currency_id},
          ${transactions.amount} AS ${transactions.amount}
        FROM 
          ${transactions.$$NAME}
        WHERE
          ${transactions.user_id} = (${userIdQuery}) AND 
          ${transactions.currency_id} = (${currencyIdQuery})
        ORDER BY
          ${transactions.created_at} DESC 
        FETCH FIRST ROW ONLY
      )

      SELECT 
        * 
      FROM 
        ${t}
      UNION  (
        SELECT 
          (${userIdQuery})::uuid AS ${transactions.user_id},
          (${currencyIdQuery}) AS ${transactions.currency_id},
          0 AS ${transactions.amount}
        WHERE
          NOT EXISTS (SELECT * FROM ${t}) AND
          EXISTS (SELECT 1 FROM ${users.$$NAME} WHERE ${users.user_id} = (${userIdQuery}))
      )
    `;
    }

    private createGetSellerBlackRateFromUserId() {
        return `
      SELECT 
        ${blackRates.rate}
      FROM 
        ${blackRates.$$NAME} 
      WHERE 
        ${blackRates.seller_id} = ${this.sellerId} AND
        ${blackRates.base} = ${this.baseCurrency} AND
        ${blackRates.quota} = ${this.quotaCurrency}
      ORDER BY
        ${blackRates.time} DESC
      FETCH FIRST ROW ONLY
    `;
    }

    private createSellerUserIdQuery(sellerUserIdName: string) {
        return `
      SELECT 
        u.${users.user_id} AS ${sellerUserIdName}
      FROM 
        ${users.$$NAME} as u
      LEFT JOIN
        ${sellers.$$NAME} as s
      ON
        s.${sellers.user_id} = u.${users.user_id}
      WHERE 
        s.${sellers.seller_id} = ${this.sellerId} AND
        u.${users.user_id} <> ${this.buyerUserId}
    `;
    }
}
