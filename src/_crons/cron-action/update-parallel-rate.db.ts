import { Injectable } from "victormadu-nist-core";
import { UpdateParallelRatePostgresDbManager as DbManager } from "./update-parallel-rate.db.manager";
import { PoolClient } from "pg";
import { currencies, parallelRates } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import { forEach, keys } from "lodash";

type InData = {
    time: number;
    rate: number;
    currency_id: string;
}[];

@Injectable()
export class DbService {
    constructor(
        private dbManager: DbManager,
        private helper: PostgresHeplper,
        private runner: PostgresPoolClientRunner
    ) {}

    private onReady() {
        this.runner.setPsql(this.dbManager.getPsql());
    }

    async getCurrencies() {
        return await this.runner.runQuery(async (psql) => await this._getCurrencies(psql));
    }

    async updateParallelRates(inData: InData): Promise<boolean | undefined> {
        return await this.runner.runQuery(
            async (psql) => await this._updateParallelRates(psql, inData)
        );
    }

    async storeAndGetCurrencyName(inData: Record<string, string>) {
        return await this.runner.runQuery(
            async (psql) => await this._storeAndGetCurrencyName(psql, inData)
        );
    }

    private async _storeAndGetCurrencyName(psql: PoolClient, inData: Record<string, string>) {
        const queryCreator = new SetCurrenciesNameQueryCreator(this.helper, inData);
        const result = await psql.query<{ currencies: string }>(queryCreator.getQuery());
        return this.helper.getFromAllRows(result, "currencies");
    }

    private async _getCurrencies(psql: PoolClient) {
        const queryCreator = new GetCurrenciesQueryCreator();
        const result = await psql.query<{ currency: string }>(queryCreator.getQuery());
        return this.helper.getFromAllRows(result, "currency");
    }

    private async _updateParallelRates(psql: PoolClient, inData: InData): Promise<boolean> {
        const queryCreator = new ParallelRatesUpdateQueryCreator(this.helper, inData);
        console.log("_updateParallelRates query", queryCreator.getQuery());
        try {
            const result = await psql.query<{ currencies: string }>(queryCreator.getQuery());
            console.log("_updateParallelRates result", result);
            return this.helper.hasAlteredTable(result);
        } catch (error) {
            console.log("_updateParallelRates error", error);
            throw error;
        }
    }
}

class SetCurrenciesNameQueryCreator {
    constructor(private helper: PostgresHeplper, private inData: { [symbol: string]: string }) {}
    getQuery() {
        return `
      INSERT INTO
        ${currencies.$$NAME}
        (${currencies.currency_id}, ${currencies.full_name})
      SELECT
        *
      FROM 
        (VALUES ${this.getValuesQuery()})
      AS 
        __t(${currencies.currency_id}, ${currencies.full_name})
      WHERE NOT EXISTS (
        SELECT 
          1
        FROM 
          ${currencies.$$NAME}
        FETCH FIRST ROW ONLY
      )
      RETURNING 
        ${currencies.currency_id} AS currencies
    `;
    }

    private getValuesQuery() {
        let queryValueBuilderStr = "";

        const symbols = keys(this.inData);
        forEach(symbols, (symbol) => {
            queryValueBuilderStr += this.getValueQuery(symbol);
        });

        return queryValueBuilderStr.slice(0, -1);
    }

    private getValueQuery(symbol: string) {
        const sanitizedSym = this.helper.sanitize(symbol);
        const sanitizedName = this.helper.sanitize(this.getCurrencyNameFromSymbol(symbol));
        return `(${sanitizedSym},${sanitizedName}),`;
    }

    private getCurrencyNameFromSymbol(symbol: string) {
        return this.inData[symbol];
    }
}

class GetCurrenciesQueryCreator {
    getQuery() {
        return `
      SELECT 
        ${currencies.currency_id} as currency
      FROM
        ${currencies.$$NAME}
    `;
    }
}

class ParallelRatesUpdateQueryCreator {
    constructor(private helper: PostgresHeplper, private inData: InData) {}

    getQuery() {
        if (this.inData.length === 0) return ``;
        return `
      INSERT INTO
        ${parallelRates.$$NAME}
        (
          ${parallelRates.currency_id},
          ${parallelRates.rate},
          ${parallelRates.time}
        )
      VALUES
        ${this.generateAllColValuesQuery()} 
    `;
    }

    private generateAllColValuesQuery() {
        let query = "";
        let i = 0;
        const len = this.inData.length - 1;
        while (i < len) {
            query += this.generateColValuesQuery(i);
            query += ",";
            i++;
        }

        query += this.generateColValuesQuery(i); // this is the reason why i added -1 to len. This is the remaining operation
        return query;
    }

    private generateColValuesQuery(colIndex: number) {
        const colValue = this.inData[colIndex];
        const { currency_id, rate, time } = colValue;
        return `(${this.helper.sanitize(currency_id)}, ${this.helper.sanitize(
            rate
        )}, to_timestamp(${this.helper.sanitize(time)})::TIMESTAMPTZ)`;
    }
}
