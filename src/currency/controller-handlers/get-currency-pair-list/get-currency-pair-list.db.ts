import postgres from "postgres";
import { blackRates, currencies, parallelRates, users } from "utils/postgres-db-types/erate";
import { ParallelRates, BlackRates } from "utils/postgres-db-types/interfaces/erate.interface";
import { TIMESTAMP_NULL } from "./constants";
import { Data, DateFrom_Data, Date_Data, Db, DbCon, Payload } from "./interface";

const ONE_HOUR = 1 * 60 * 60;

// TODO: All db result may result undefined or empty array

export class GetCurrencyPairListDb implements Db {
  psql: postgres.Sql<{}>;
  payload!: Payload;
  constructor(dbCon: DbCon) {
    this.psql = dbCon.getPsql();
  }

  async getTotal(): Promise<number> {
    const [{ total }] = await this.psql<{ total: number }[]>`
      SELECT COUNT(*) as total FROM ${currencies.$$NAME}
    `;

    return total;
  }

  async getFavourites(userId: string): Promise<[string, string][]> {
    const [result] = await this.psql<{ [users.favourite_currency_pairs]: [string, string][] }[]>`
      SELECT 
        ${users.favourite_currency_pairs} 
      FROM 
        ${users.$$NAME}
      WHERE
        ${users.user_id} = ${userId}
    `;

    return result[users.favourite_currency_pairs];
  }

  async getNamesAndRates(payload: Payload): Promise<DateFrom_Data[] | Date_Data[] | undefined> {
    this.setCtxPayload(payload);
    return await this.createQuerier()?.get();
  }

  private setCtxPayload(payload: Payload) {
    this.payload = payload;
  }

  private createQuerier() {
    const market = this.payload.market;
    const lowerTimestamp = this.payload.dateFrom;
    const highTimestamp = this.payload.dateTo as number;
    const timestamp = this.payload.date;
    const offset = this.payload.pageOffset;
    const limit = this.payload.pageCount;
    const base = this.payload.base;

    if (market === "parallel" && lowerTimestamp)
      return new Parallel_Market_Currency_Names_And_Rates_From_Timestamp_Range(this.psql, {
        lowerTimestamp,
        highTimestamp,
        offset,
        limit,
      });
    else if (market === "parallel")
      return new Parallel_Market_Currency_Names_And_Rates_From_Timestamp(this.psql, {
        timestamp,
        offset,
        limit,
      });
    else if (market === "black" && lowerTimestamp)
      return new Black_Market_Currency_Names_And_Rate_From_Timestamp_Range(this.psql, {
        lowerTimestamp,
        highTimestamp,
        offset,
        limit,
        base,
      });
    else if (market === "black")
      return new Black_Market_Currency_Names_And_Rates_From_Timestamp(this.psql, {
        timestamp,
        offset,
        limit,
        base,
      });

    return;
  }
}

class To_Postgres_Type_Transformer {
  //  TODO: Check if it is valid timestamp number in the sanitizer
  to_timestamptz(int: number) {
    if (int === TIMESTAMP_NULL) return "NOW()";
    return `to_timestamp(${int})::TIMESTAMPTZ`;
  }
}

class Parallel_Market_Table {
  $name = parallelRates.$$NAME;
  currency_id = parallelRates.currency_id;
  rate = parallelRates.rate;
  timestamp = parallelRates.time;
}

class Parallel_Market_Currency_Names_And_Rates_From_Timestamp {
  t = new Parallel_Market_Table();
  transformer = new To_Postgres_Type_Transformer();
  inData_timestamptz: string;

  constructor(
    private psql: postgres.Sql<{}>,
    private inData: { timestamp: number; offset: number; limit: number }
  ) {
    this.inData_timestamptz = this.transformer.to_timestamptz(this.inData.timestamp);
  }
  // TODO: Set all database coming in as dangerous for sanitizing before coming into the db stage
  async get(): Promise<Data[]> {
    return await this.psql<{ quota: string; curr_rate: number[]; prev_rate: number[] }[]>`
      SELECT 
        DISTINCT ON(${this.t.currency_id}) 
          ${this.t.currency_id} as quota, 
          ARRAY[${this.curr_rate()}] as curr_rate,
          ARRAY[${this.prev_or_curr_rate_if_prev_null()}] as prev_rate
      FROM 
        ${this.t.$name}
      WHERE 
        ${this.inData_timestamptz} >= ${this.t.timestamp}
      WINDOW w AS (
          PARTITION BY ${this.t.currency_id}
          ORDER BY ${this.inData_timestamptz} - ${this.t.timestamp}
          RANGE BETWEEN 
            UNBOUNDED PRECEDING AND 
            UNBOUNDED FOLLOWING
      )
      OFFSET ${this.inData.offset}
      FETCH FIRST ${this.inData.limit} ROWS ONLY
  `;
  }

  private curr_rate() {
    return `(FIRST_VALUE(${this.t.rate}) OVER w)`;
  }
  private prev_rate() {
    return `(NTH_VALUE(${this.t.rate}, 2) OVER w)`;
  }
  private prev_or_curr_rate_if_prev_null() {
    return `COALESCE(${this.prev_rate()},${this.curr_rate()})`;
  }
}

class Parallel_Market_Currency_Names_And_Rates_From_Timestamp_Range {
  t = new Parallel_Market_Table();
  transformer = new To_Postgres_Type_Transformer();
  lower_timestamptz: string;
  high_timestamptz: string;

  constructor(
    private psql: postgres.Sql<{}>,
    private inData: {
      lowerTimestamp: number;
      highTimestamp: number;
      offset: number;
      limit: number;
    }
  ) {
    this.lower_timestamptz = this.transformer.to_timestamptz(this.inData.lowerTimestamp);
    this.high_timestamptz = this.transformer.to_timestamptz(this.inData.highTimestamp);
  }

  async get(): Promise<Data[]> {
    return await this.psql<{ quota: string; curr_rate: number[]; time: number[] }[]>`
    SELECT 
      t.quota as quota, 
      array_agg(t.rate) AS curr_rate, 
      array_agg(t.time * ${ONE_HOUR}) AS time 
    FROM 
      (
        SELECT 
          ${this.t.currency_id} as quota, 
          AVG(${this.t.rate}) AS rate,
          EXTRACT(EPOCH FROM ${this.t.timestamp}) / ${ONE_HOUR} AS time
        FROM 
          ${this.t.$name}
        WHERE 
          time >= ${this.lower_timestamptz} AND
          time <= ${this.high_timestamptz}
        GROUP BY 
          ${this.t.currency_id}, 
          EXTRACT(EPOCH FROM ${this.t.timestamp}) / ${ONE_HOUR}
      ) as t
    GROUP BY 
      t.quota
    OFFSET 
      ${this.inData.offset}
    FETCH FIRST ${this.inData.limit} ROWS ONLY
  `;
  }
}

class Black_Market_Base {
  table = blackRates.$$NAME;
  base = blackRates.base;
  quota = blackRates.quota;
  rate = blackRates.rate;
  seller_id = blackRates.seller_id;
  timestamp = blackRates.time;
}

class Black_Market_Currency_Names_And_Rates_From_Timestamp {
  t = new Black_Market_Base();
  transformer = new To_Postgres_Type_Transformer();

  constructor(
    private psql: postgres.Sql<{}>,
    private inData: { timestamp: number; offset: number; limit: number; base: string }
  ) {}

  async get(): Promise<Date_Data[]> {
    return await this.psql<Date_Data[]>`
      SELECT 
        ${this.quota} as quota, 
        AVG(${this.rate}) as rate 
      FROM 
      (
        SELECT 
          DISTINCT ON(${this.seller_id}, ${this.quota}) 
            ${this.seller_id}, ${this.quota}
          FIRST_VALUE(${this.rate}) 
            OVER(
              PARTITION BY ${this.seller_id}, ${this.quota}
              ORDER BY 
              (
                ${this.getTimeStampOrNow(this.inData.timestamp)} - ${this.postegresTimestampToInt(
      this.timestamp
    )}) ASC
              ) as ${this.rate}
          FROM 
            ${this.table}
          WHERE 
            (
              ${this.getTimeStampOrNow(this.inData.timestamp)} >= ${this.postegresTimestampToInt(
      this.timestamp
    )}
            ) 
            AND
            ${this.base} = ${this.inData.base}
      )
      GROUP BY ${this.quota}
      OFFSET ${this.inData.offset}
      FETCH FIRST ${this.inData.offset} ROWS ONLY
  `;
  }
}

class Black_Market_Currency_Names_And_Rate_From_Timestamp_Range extends Black_Market_Base {
  constructor(
    private psql: postgres.Sql<{}>,
    private inData: {
      lowerTimestamp: number;
      highTimestamp: number;
      offset: number;
      limit: number;
      base: string;
    }
  ) {
    super();
  }

  async get(): Promise<DateFrom_Data[]> {
    return await this.psql<DateFrom_Data[]>`
      SELECT 
        t.${this.quota} as quota, 
        array_agg(t.${this.rate}) as rate, 
        array_agg(t.${this.timestamp}) as time
      FROM (
        SELECT 
          ${this.quota},
          AVG(${this.rate}) AS ${this.rate},
          (${this.postegresTimestampToInt(this.timestamp)}/ ${PER_HOUR}) * ${PER_HOUR} AS ${
      this.timestamp
    }
        FROM 
          ${this.table}
        WHERE ${this.base} = ${this.inData.base}
          AND 
            ${this.postegresTimestampToInt(
              this.timestamp
            )} > -1                         -- -1 means the seller deleted the rate 
          AND 
            (${this.postegresTimestampToInt(this.timestamp)} >= ${this.inData.lowerTimestamp})     
          AND 
            (${this.postegresTimestampToInt(this.timestamp)}) <= ${this.inData.highTimestamp})      
        GROUP BY 
            ${this.quota}, ${this.postegresTimestampToInt(this.timestamp)}/ ${PER_HOUR}
      ) AS t
      GROUP BY 
        t.${this.quota}
      OFFSET 
        ${this.inData.offset}
      FETCH FIRST ${this.inData.limit} ROWS ONLY;
  `;
  }
}
