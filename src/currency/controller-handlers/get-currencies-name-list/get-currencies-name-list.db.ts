import { Injectable } from "nist-core/injectables";
import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { PoolClient } from "pg";
import { currencies } from "../../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../../utils/postgres-helper";

interface InData {}

interface OutData {
  short: string;
  long: string;
}

const table = currencies;

@Injectable()
export class DbService {
  constructor(
    private currencyDb: CurrencyPostgresDbService,
    private helper: PostgresHeplper,
    private runner: PostgresPoolClientRunner
  ) {}

  private onReady() {
    this.runner.setPsql(this.currencyDb.getPsql());
  }

  async getCurrenciesName(): Promise<OutData[]> {
    return (
      (await this.runner.runQuery(
        async (psql) => await this._getCurrenciesName(psql)
      )) ?? []
    );
  }

  async _getCurrenciesName(psql: PoolClient): Promise<OutData[]> {
    const result = await psql.query<OutData>(`
      SELECT 
        ${table.currency_id} as short,
        ${table.full_name} as long
      FROM 
        ${table.$$NAME}
    `);
    return this.helper.getAllRows(result);
  }
}
