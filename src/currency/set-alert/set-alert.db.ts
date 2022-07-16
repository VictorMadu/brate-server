import { Injectable } from "victormadu-nist-core";
import { CurrencyPostgresDbService as PostgresDbService } from "../_utils/currency.db.service";
import { PoolClient, QueryResult } from "pg";
import {
    wallet_currency_transactions as transactions,
    sellers,
    blackRates,
    price_alerts,
    parallelRates,
} from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
    userId: string;
    targetRate: number;
    marketType: "parallel" | "black";
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

    async setAlert(inData: InData): Promise<boolean> {
        return !!(await this.runner.runQuery((psql) => this._setAlert(psql, inData)));
    }

    // TODO: use pl/psSQL
    // buyer gives base to seller
    // seller gives quota to buyer
    async _setAlert(psql: PoolClient, inData: InData): Promise<boolean> {
        const queryCreator = new SetAlertQueryCreator(
            {
                userId: this.helper.sanitize(inData.userId),
                targetRate: this.helper.sanitize(inData.targetRate),
                baseCurrency: this.helper.sanitize(inData.baseCurrency),
                quotaCurrency: this.helper.sanitize(inData.quotaCurrency),
            },
            {
                marketType: inData.marketType,
            }
        );

        console.log("_setAlert query", queryCreator.getQuery());
        const result = await psql.query(queryCreator.getQuery());
        return this.helper.hasAlteredTable(result);
    }
}

// TODO: Rewrite this using state pattern
class SetAlertQueryCreator {
    private userId: string;
    private targetRate: number;
    private marketType: "parallel" | "black";
    private baseCurrency: string;
    private quotaCurrency: string;

    constructor(
        sanitizedInData: {
            userId: string;
            targetRate: number;
            baseCurrency: string;
            quotaCurrency: string;
        },
        config: { marketType: "parallel" | "black" }
    ) {
        this.userId = sanitizedInData.userId;
        this.targetRate = sanitizedInData.targetRate;
        this.baseCurrency = sanitizedInData.baseCurrency;
        this.quotaCurrency = sanitizedInData.quotaCurrency;
        this.marketType = config.marketType;
    }

    getQuery() {
        return `
      INSERT INTO 
        ${price_alerts.$$NAME}
        (
          ${price_alerts.user_id},
          ${price_alerts.set_rate},
          ${price_alerts.target_rate},
          ${price_alerts.base},
          ${price_alerts.quota},
          ${price_alerts.market_type}
        )
      SELECT 
        ${this.userId},
        (${this.createGetMarketAvgRateQuery()}),
        ${this.targetRate},
        ${this.baseCurrency},
        ${this.quotaCurrency},
        ${this.createMarketTypeDbType()}
      WHERE 
        NOT EXISTS (
          SELECT 
            '1'
          FROM 
            ${price_alerts.$$NAME}
          WHERE
            ${price_alerts.base} = ${this.baseCurrency} AND
            ${price_alerts.quota} = ${this.quotaCurrency} AND
            ${price_alerts.market_type}  = ${this.createMarketTypeDbType()} AND
            ${price_alerts.target_rate}  = ${this.targetRate} AND
            ${price_alerts.user_id}  = ${this.userId} AND
            ${price_alerts.deleted_at} IS NULL
          FETCH FIRST ROW ONLY
        )
    `;
    }

    private createMarketTypeDbType() {
        if (this.marketType === "black") return `'B'`;
        return `'P'`;
    }

    // TODO: Split this function, create a factory class for getting the average rate query for the market type, the implementation to be returned by the factory should implement a getAvgRateQuery()
    private createGetMarketAvgRateQuery() {
        if (this.marketType === "black") return this.createGetBlackMarketAvgRateQuery();
        return this.createGetParallelMarketAvgRateQuery();
    }
    private createGetBlackMarketAvgRateQuery() {
        const t = "__t";
        return `
      SELECT 
        avg(${t}.${blackRates.rate})
      FROM 
        (
        SELECT  
          DISTINCT ON (${blackRates.seller_id})
          FIRST_VALUE(${blackRates.rate}) OVER w AS ${blackRates.rate}  
        FROM
          ${blackRates.$$NAME}
        WHERE
          ${blackRates.time} <= NOW() AND
          ${blackRates.base} = ${this.baseCurrency} AND
          ${blackRates.quota} = ${this.quotaCurrency}
        WINDOW w AS (PARTITION BY ${blackRates.seller_id} ORDER BY ${blackRates.time} DESC)
        ) AS ${t}
      WHERE 
        ${t}.${blackRates.rate} IS NOT NULL
    `;
    }

    private createGetParallelMarketAvgRateQuery() {
        return `SELECT
      (${this.createGetLastestParallelRateOfCurrency(
          this.quotaCurrency
      )})/(${this.createGetLastestParallelRateOfCurrency(this.baseCurrency)})`;
    }

    private createGetLastestParallelRateOfCurrency(currencyId: string) {
        return `
      SELECT  
        ${parallelRates.rate} 
      FROM
        ${parallelRates.$$NAME}
      WHERE
        ${parallelRates.time} <= NOW() AND
        ${parallelRates.currency_id} = ${currencyId}
      ORDER BY
        ${parallelRates.time} DESC
      FETCH FIRST ROW ONLY
    `;
    }
}
