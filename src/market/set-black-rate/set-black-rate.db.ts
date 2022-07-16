import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/market.db.service";
import { PoolClient } from "pg";
import {
    wallet_currency_transactions as transactions,
    sellers,
    blackRates,
} from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface SetInData {
    userId: string;
    rate: number;
    baseCurrency: string;
    quotaCurrency: string;
}

interface DropInData {
    userId: string;
    baseCurrency: string;
    quotaCurrency: string;
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

    async setUserBlackCurrencyRate(inData: SetInData): Promise<boolean> {
        return !!(await this.runner.runQuery((psql) =>
            this._setUserBlackCurrencyRate(psql, inData)
        ));
    }

    async dropUserBlackCurrencyRate(inData: DropInData): Promise<boolean> {
        return !!(await this.runner.runQuery((psql) =>
            this._dropUserBlackCurrencyRate(psql, inData)
        ));
    }

    private async _setUserBlackCurrencyRate(psql: PoolClient, inData: SetInData): Promise<boolean> {
        const queryCreator = new SetBlackRateQueryCreator({
            userId: this.helper.sanitize(inData.userId),
            rate: this.helper.sanitize(inData.rate),
            baseCurrency: this.helper.sanitize(inData.baseCurrency),
            quotaCurrency: this.helper.sanitize(inData.quotaCurrency),
        });

        console.log("_setUserBlackCurrencyRate query", queryCreator.getQuery());
        const result = await psql.query(queryCreator.getQuery());
        return this.helper.hasAlteredTable(result);
    }

    private async _dropUserBlackCurrencyRate(
        psql: PoolClient,
        inData: DropInData
    ): Promise<boolean> {
        const queryCreator = new DropBlackRateQueryCreator({
            userId: this.helper.sanitize(inData.userId),
            baseCurrency: this.helper.sanitize(inData.baseCurrency),
            quotaCurrency: this.helper.sanitize(inData.quotaCurrency),
        });

        console.log("_dropUserBlackCurrencyRate query", queryCreator.getQuery());
        const result = await psql.query(queryCreator.getQuery());
        return this.helper.hasAlteredTable(result);
    }
}

class SetBlackRateQueryCreator {
    private userId: string;
    private rate: number;
    private baseCurrency: string;
    private quotaCurrency: string;

    constructor(sanitizedInData: SetInData) {
        this.userId = sanitizedInData.userId;
        this.rate = sanitizedInData.rate;
        this.baseCurrency = sanitizedInData.baseCurrency;
        this.quotaCurrency = sanitizedInData.quotaCurrency;
    }

    getQuery() {
        return `
      INSERT INTO
        ${blackRates.$$NAME}
        (
          ${blackRates.seller_id},
          ${blackRates.base},
          ${blackRates.quota},
          ${blackRates.rate}
        )
      SELECT 
        ${sellers.seller_id},
        ${this.baseCurrency},
        ${this.quotaCurrency},
        ${this.rate}
      FROM 
        ${sellers.$$NAME} 
      WHERE 
        ${sellers.user_id} = ${this.userId} AND 
        NOT EXISTS (
          SELECT 
            1
          FROM (
            SELECT 
              rate
            FROM 
              ${blackRates.$$NAME}
            WHERE
              ${blackRates.seller_id} = ${sellers.seller_id} AND
              ${blackRates.base} = ${this.baseCurrency} AND
              ${blackRates.quota} = ${this.quotaCurrency} 
            ORDER BY 
              ${blackRates.time} DESC
            FETCH FIRST ROW ONLY
          ) AS __q
          WHERE 
            ${blackRates.rate} = ${this.rate}
        )
    `;
    }
}

class DropBlackRateQueryCreator {
    private userId: string;
    private baseCurrency: string;
    private quotaCurrency: string;

    constructor(sanitizedInData: DropInData) {
        this.userId = sanitizedInData.userId;
        this.baseCurrency = sanitizedInData.baseCurrency;
        this.quotaCurrency = sanitizedInData.quotaCurrency;
    }

    getQuery() {
        const b = "__b";
        const s = "__s";
        return `
      INSERT INTO
        ${blackRates.$$NAME}
        (
          ${blackRates.seller_id},
          ${blackRates.base},
          ${blackRates.quota},
          ${blackRates.rate}
        )
      SELECT
        __bb.${blackRates.seller_id},
        __bb.${blackRates.base},
        __bb.${blackRates.quota},
        NULL
      FROM
        (
          SELECT
              ${b}.${blackRates.seller_id},
              ${b}.${blackRates.base},
              ${b}.${blackRates.quota},
              ${b}.${blackRates.rate}
          FROM 
            ${blackRates.$$NAME} AS ${b}
          INNER JOIN 
            ${sellers.$$NAME} AS ${s}
          ON
            ${s}.${sellers.user_id} = ${this.userId}
          WHERE 
            ${s}.${sellers.user_id} = ${this.userId} AND
            ${b}.${blackRates.base} = ${this.baseCurrency} AND
            ${b}.${blackRates.quota} = ${this.quotaCurrency}
          ORDER BY
            ${b}.${blackRates.time} DESC
          FETCH FIRST ROW ONLY
        ) AS __bb
      -- If the latest rate is not null (deleted)
      WHERE 
        __bb.${blackRates.rate}  IS NOT NULL
    `;
    }
}
