import { Injectable } from "victormadu-nist-core";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { InData, OutData } from "./interface";
import { PoolClient } from "pg";
import { price_alerts } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import {
    removeTrailingZeroesFromNumeric,
    timestampToNumeric,
    toFloat,
    toString,
} from "../../utils/postgres-type-cast";

const table = price_alerts;

// TODO: Send a code as part of response to indicate status and error type
@Injectable()
export class GetAlertListDbService {
    constructor(
        private currencyDb: CurrencyPostgresDbService,
        private helper: PostgresHeplper,
        private runner: PostgresPoolClientRunner
    ) {}

    private onReady() {
        this.runner.setPsql(this.currencyDb.getPsql());
    }

    async getPriceAlerts(inData: InData): Promise<OutData[]> {
        return (await this.runner.runQuery((psql) => this._getPriceAlerts(psql, inData))) ?? [];
    }

    async _getPriceAlerts(psql: PoolClient, inData: InData): Promise<OutData[]> {
        const queryCreator = new GetPriceAlertsQueryCreator(
            {
                userId: this.helper.sanitize(inData.userId),
                offset: this.helper.sanitize(inData.offset),
                limit: this.helper.sanitize(inData.limit),
            },
            {
                market: inData.market_type,
                filter: inData.filter,
            }
        );
        console.log("_getPriceAlerts query", queryCreator.getQuery());
        const result = await psql.query<OutData>(queryCreator.getQuery());
        return this.helper.getAllRows(result);
    }
}

// TODO: SERIOUS ISSUE: ensure all the data type returned from query is correct
// TODO: SERIOUS ISSUE: better sanitization of input data.
class GetPriceAlertsQueryCreator {
    private userId: string;
    private offset: number;
    private limit: number;
    constructor(
        sanitizedInData: { userId: string; offset: number; limit: number },
        private config: {
            market: "parallel" | "black";
            filter: "all" | "untriggered" | "triggered";
        }
    ) {
        this.userId = sanitizedInData.userId;
        this.offset = sanitizedInData.offset;
        this.limit = sanitizedInData.limit;
    }

    // TODO: No need for set_rate, we can obtain from the market rate using the created_at time.
    // Also the triggered_at can be obtained by checking if price has ever gone up after the creation. This may affect performance that is why it is here. 
    // But we can use a materialized_view to hold untriggered alerts
    getQuery() {
        return ` 
    SELECT 
      ${toString(table.price_alert_id)} as id,
      ${toString(table.base)} as base,
      ${toString(table.quota)} as quota,
      ${removeTrailingZeroesFromNumeric(table.target_rate)} as target_rate,
      ${removeTrailingZeroesFromNumeric(table.set_rate)} as created_rate,
      ${timestampToNumeric(table.created_at)} as created_at,
      ${timestampToNumeric(table.triggered_at)} as triggered_at
    FROM 
      ${table.$$NAME}
    WHERE 
      ${table.user_id} = ${this.userId} AND
      ${table.market_type} = ${this.getMarketType()} AND 
      ${table.deleted_at} IS NULL AND
      ${this.getFilterQuery()}
    OFFSET
      ${this.offset}
    FETCH FIRST ${this.limit} ROWS ONLY
    `;
    }

    private getMarketType() {
        if (this.config.market === "black") return `'B'`;
        return `'P'`;
    }

    private getFilterQuery() {
        const filter = this.config.filter;
        if (filter === "untriggered") return `${table.triggered_at} IS NULL`;
        if (filter === "triggered") return `${table.triggered_at} IS NOT NULL`;
        return `TRUE`;
    }
}
