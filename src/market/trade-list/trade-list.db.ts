import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/market.db.service";
import { PoolClient } from "pg";
import {
    blackRates,
    sellers,
    users,
    wallet_currency_transactions as wallet,
} from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import { timestampToNumeric, toFloat, toString } from "../../utils/postgres-type-cast";

interface InData {
    interestedPairs: {
        base: string;
        quota: string;
    }[];
    pageOffset: number;
    pageCount: number;
}

interface OutData {
    user_id: string;
    seller_id: string;
    seller_name: string;
    pair: string;
    amount_available: number;
    rate: number;
    created_at: number;
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

    async getTradersData(inData: InData) {
        return (
            (await this.runner.runQuery(
                async (psql) => await this._getTradersDataAndLastestRates(psql, inData)
            )) ?? []
        );
    }

    private async _getTradersDataAndLastestRates(psql: PoolClient, inData: InData) {
        const queryCreator = new GetTradersDataAndLastestRatesQueryCreator(this.helper, inData);
        console.log("_getTradersDataAndLastestRates query ", queryCreator.getQuery());
        try {
            const result = await psql.query<OutData>(queryCreator.getQuery());
            console.log("_getTradersDataAndLastestRates result ", result);
            return this.helper.getAllRows(result);
        } catch (error) {
            console.log("_getTradersDataAndLastestRates error ", error);
            throw error;
        }
    }
}

class GetTradersDataAndLastestRatesQueryCreator {
    private unSanitizedInterestedPairs: {
        base: string;
        quota: string;
    }[];
    private pageOffset: number;
    private pageCount: number;

    private b = "__b";
    private t = "__t";
    private s = "__s";
    private w = "__w";
    private q = "__q";
    private u = "__u";

    constructor(private helper: PostgresHeplper, private inData: InData) {
        this.unSanitizedInterestedPairs = this.inData.interestedPairs;
        this.pageOffset = this.helper.sanitize(this.inData.pageOffset);
        this.pageCount = this.helper.sanitize(this.inData.pageCount);
    }

    getQuery() {
        return `
    SELECT 
      *
    FROM 
    (
      SELECT DISTINCT 
        ON (${this.b}.${blackRates.base}, ${this.b}.${blackRates.quota}, ${this.b}.${
            blackRates.seller_id
        })
        ${toString(`${this.s}.${sellers.user_id}`)} AS user_id,
        ${toString(`${this.b}.${blackRates.seller_id}`)} AS seller_id,
        ${toString(`${this.u}.${users.name}`)} AS seller_name,
        ${toString(`${this.b}.${blackRates.base} || ' ' || ${this.b}.${blackRates.quota}`)} AS pair,
        ${toFloat(`${this.t}.${wallet.amount}`)} AS amount_available,
        FIRST_VALUE(${toFloat(`${this.b}.${blackRates.rate}`)}) OVER ${this.w} AS rate,
        FIRST_VALUE(${timestampToNumeric(`${this.b}.${blackRates.time}`)}) OVER ${
            this.w
        } AS created_at
      FROM 
        ${blackRates.$$NAME} AS ${this.b} 
      LEFT JOIN 
        ${sellers.$$NAME} AS ${this.s} 
      ON 
        ${this.b}.${blackRates.seller_id} = ${this.s}.${sellers.seller_id}
      LEFT JOIN 
        ${users.$$NAME} AS ${this.u}
      ON 
        ${this.u}.${users.user_id} = ${this.s}.${sellers.user_id}
      INNER JOIN LATERAL (
        SELECT 
          ${wallet.amount}
        FROM 
          ${wallet.$$NAME} 
        WHERE 
          ${wallet.user_id} = ${this.s}.${sellers.user_id} AND 
          ${wallet.currency_id} = ${this.b}.${blackRates.base}
        ORDER BY 
          ${wallet.created_at} DESC 
        FETCH FIRST ROW ONLY
      ) AS ${this.t}
      ON TRUE 
      WINDOW ${this.w} AS (PARTITION BY ${this.b}.${blackRates.base}, ${this.b}.${
            blackRates.quota
        }, ${this.b}.${blackRates.seller_id} ORDER BY ${this.b}.${blackRates.time} DESC)
    ) AS ${this.q}
    WHERE 
      rate IS NOT NULL
    OFFSET ${this.pageOffset}
    FETCH FIRST ${this.pageCount} ROWS ONLY
    `;
    }

    private createWhereQueryFromPair() {
        if (this.isUnSanitizedPairsArrEmpty()) return `TRUE`;

        let queryBuilder = "";
        for (let i = 0; i < this.unSanitizedInterestedPairs.length; i++) {
            const { base: unSanitizedBase, quota: unSanitizedQuota } =
                this.unSanitizedInterestedPairs[i];

            const base = this.helper.sanitize(unSanitizedBase);
            const quota = this.helper.sanitize(unSanitizedQuota);

            queryBuilder += `(${this.b}.${blackRates.base} = ${base} AND ${this.b}.${blackRates.quota} = ${quota}) OR`;
        }

        return this.removeLastTrailiingORAndSpaceFrom(queryBuilder);
    }

    private removeLastTrailiingORAndSpaceFrom(queryBuilder: string) {
        const positionToStartToRemove = 3; // ' OR' => 3
        return queryBuilder.slice(0, -positionToStartToRemove);
    }

    private isUnSanitizedPairsArrEmpty() {
        return this.unSanitizedInterestedPairs.length === 0;
    }
}
