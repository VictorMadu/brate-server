import { CurrencyPostgresDbService } from "../_utils/currency.db.service";
import { Injectable } from "nist-core/injectables";
import { PoolClient } from "pg";
import {
  blackRates,
  currencies,
  parallelRates,
  users,
} from "../../../utils/postgres-db-types/erate";
import { Db_Querier, In_Data, Out_Data, Payload } from "./interface";
import { PostgresHeplper } from "../../../utils/postgres-helper";

const t = "__t";
const t1 = "__t1";
const t2 = "__t2";
const prev_time = "__prev_time";

// TODO: All db result may result undefined or empty array
// TODO: clean data

// TODO: Ensure listeners are called from minimal to top

@Injectable()
export class GetCurrencyPairListDbService implements Db_Querier {
  psql!: PoolClient;
  payload!: Payload;
  market!: "black" | "parallel";
  inData!: In_Data;
  constructor(private currencyDb: CurrencyPostgresDbService, private helper: PostgresHeplper) {}

  private onReady() {
    this.psql = this.currencyDb.getPsql();
  }

  async getTotal(): Promise<number | undefined> {
    const results = await this.psql.query<{ total: number }>(`
      SELECT COUNT(*) as total FROM ${currencies.$$NAME}
    `);
    return this.helper.getFromFirstRow(results, "total");
  }

  async getFavourites(userId: string): Promise<[string, string][] | undefined> {
    const colName = users.favourite_currency_pairs;
    const result = await this.psql.query<{ [colName]: [string, string][] }>(`
      SELECT 
        ${colName} 
      FROM 
        ${users.$$NAME}
      WHERE
        ${users.user_id} = ${userId}
    `);
    return this.helper.getFromFirstRow(result, colName);
  }

  async getCurrenciesRatesFromMarket(
    marketType: "black" | "parallel",
    inData: In_Data
  ): Promise<Out_Data> {
    return await this.createQuerierFromMarketTypeAndInData(marketType, inData).get();
  }

  private createQuerierFromMarketTypeAndInData(marketType: "black" | "parallel", inData: In_Data) {
    if (marketType === "black") return new Black_Market(this.psql, inData);
    return new Parallel_Market(this.psql, inData);
  }
}

class Black_Market {
  table = blackRates;

  constructor(private psql: PoolClient, private inData: In_Data) {}
  async get() {
    const result = await this.psql.query<{ quota: string; timestamps: number[]; rates: number[] }>(`
      SELECT 
        ${t}.${this.table.quota} as quota,
        array_agg(${t}.${this.table.time}) as timestamps,
        array_agg(${t}.${this.table.rate}) as rates
      FROM  (
        SELECT 
          ${this.table.quota} as ${this.table.quota},  
          floor((EXTRACT(EPOCH FROM ${t1}.${this.table.time}) /${this.inData.interval})) *
            ${this.inData.interval}  AS ${this.table.time},
          AVG(${t1}.${this.table.rate}) as ${this.table.rate}
        FROM 
          ${this.table.$$NAME} AS ${t1}
        LEFT JOIN LATERAL (
          SELECT 
            ${this.table.time} AS ${prev_time} 
          FROM
            ${this.table.$$NAME}
          WHERE 
            ${this.table.base} = ${t1}.${this.table.base} AND
            ${this.table.seller_id} = ${t1}.${this.table.seller_id} AND
            ${this.table.quota} = ${t1}.${this.table.quota} AND
            ${this.table.time} < ${t1}.${this.table.time}
          ORDER BY 
            ${this.table.time} DESC
          FETCH FIRST ROW ONLY
        ) ${t2} ON TRUE
      WHERE  
        COALESCE (
          EXTRACT(EPOCH FROM ${t2}.${prev_time}),
          EXTRACT(EPOCH FROM ${t1}.${this.table.time})
        ) >= ${this.inData.from}  
          AND 
        EXTRACT(EPOCH FROM ${t1}.${this.table.time}) <= ${this.inData.to} AND
        ${this.table.base} = '${this.inData.base}'
      GROUP BY 
        ${this.table.quota}, 
        floor((EXTRACT(EPOCH FROM ${t1}.${this.table.time}) /${this.inData.interval}))
    ) AS ${t}
    GROUP BY 
      ${t}.${this.table.quota}
    OFFSET ${this.inData.offset}
    FETCH FIRST ${this.inData.limit} ROWS ONLY
  `);

    return result.rows;
  }
}
class Parallel_Market {
  table = parallelRates;

  constructor(private psql: PoolClient, private inData: In_Data) {}
  async get() {
    console.log("parallel market");
    console.log(this.table);
    console.log(this.inData);

    console.log(`
    SELECT 
    ${t}.${this.table.currency_id} as quota,
    array_agg(${t}.${this.table.time}) as timestamps,
    array_agg(${t}.${this.table.rate}) as rates
  FROM  (
    
  SELECT 
    ${this.table.currency_id} as ${this.table.currency_id},  
    floor((EXTRACT(EPOCH FROM ${t1}.${this.table.time}) /${this.inData.interval})) *
      ${this.inData.interval}  AS ${this.table.time},
    AVG(${t1}.${this.table.rate}) as ${this.table.rate}
  FROM 
    ${this.table.$$NAME} AS ${t1}
  LEFT JOIN LATERAL (
      SELECT 
        ${this.table.time} AS ${prev_time} 
      FROM
        ${this.table.$$NAME}
      WHERE 
        ${this.table.currency_id} = ${t1}.${this.table.currency_id} AND
        ${t1}.${this.table.time} > ${this.table.time}
      ORDER BY 
        ${this.table.time} DESC
      FETCH FIRST ROW ONLY
    ) ${t2} ON TRUE
  WHERE  
    COALESCE (
      EXTRACT(EPOCH FROM ${t2}.${prev_time}),
      EXTRACT(EPOCH FROM ${t1}.${this.table.time})
    ) >= ${this.inData.from}  
      AND 
    EXTRACT(EPOCH FROM ${t1}.${this.table.time}) <= ${this.inData.to}
  GROUP BY 
    ${this.table.currency_id}, 
    floor((EXTRACT(EPOCH FROM ${t1}.${this.table.time}) /${this.inData.interval}))
  ) AS ${t}
  GROUP BY 
    ${t}.${this.table.currency_id}
  OFFSET ${this.inData.offset}
  FETCH FIRST ${this.inData.limit} ROWS ONLY`);

    const result = await this.psql.query<{ quota: string; timestamps: number[]; rates: number[] }>(`
      SELECT 
        ${t}.${this.table.currency_id} as quota,
        array_agg(${t}.${this.table.time}) as timestamps,
        array_agg(${t}.${this.table.rate}) as rates
      FROM  (
        
      SELECT 
        ${this.table.currency_id} as ${this.table.currency_id},  
        floor((EXTRACT(EPOCH FROM ${t1}.${this.table.time}) /${this.inData.interval})) *
          ${this.inData.interval}  AS ${this.table.time},
        AVG(${t1}.${this.table.rate}) as ${this.table.rate}
      FROM 
        ${this.table.$$NAME} AS ${t1}
      LEFT JOIN LATERAL (
          SELECT 
            ${this.table.time} AS ${prev_time} 
          FROM
            ${this.table.$$NAME}
          WHERE 
            ${this.table.currency_id} = ${t1}.${this.table.currency_id} AND
            ${t1}.${this.table.time} > ${this.table.time}
          ORDER BY 
            ${this.table.time} DESC
          FETCH FIRST ROW ONLY
        ) ${t2} ON TRUE
      WHERE  
        COALESCE (
          EXTRACT(EPOCH FROM ${t2}.${prev_time}),
          EXTRACT(EPOCH FROM ${t1}.${this.table.time})
        ) >= ${this.inData.from}  
          AND 
        EXTRACT(EPOCH FROM ${t1}.${this.table.time}) <= ${this.inData.to}
      GROUP BY 
        ${this.table.currency_id}, 
        floor((EXTRACT(EPOCH FROM ${t1}.${this.table.time}) /${this.inData.interval}))
      ) AS ${t}
      GROUP BY 
        ${t}.${this.table.currency_id}
      OFFSET ${this.inData.offset}
      FETCH FIRST ${this.inData.limit} ROWS ONLY
  `);

    return result.rows;
  }
}
