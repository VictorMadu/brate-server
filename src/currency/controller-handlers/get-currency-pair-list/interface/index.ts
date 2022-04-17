import { headerSchema } from "currency/controller-handlers/get-currency-pair-list/schema/header.schema";
import { querystringSchema } from "currency/controller-handlers/get-currency-pair-list/schema/querystring.schema";
import { responseSchema } from "currency/controller-handlers/get-currency-pair-list/schema/response.schema";
import { FromSchema } from "json-schema-to-ts";
import postgres from "postgres";

export type Headers = FromSchema<typeof headerSchema>;
export type Query = FromSchema<typeof querystringSchema>;
export type Response = FromSchema<typeof responseSchema>;

export interface AuthParser {
  parseFromHeader(header: Record<string, any>): { userId?: string };
}

export interface DbCon {
  getPsql(): postgres.Sql<{}>;
}
//{ is_starred: S; price: number[]; quota: string }
export interface Db {
  getTotal(): Promise<number>;
  getFavourites(userId: string): Promise<[string, string][]>;
  getNamesAndRates(payload: Payload): Promise<DateFrom_Data[] | Date_Data[] | undefined>;
}

export type ServiceResult = {
  data: Response["data"]["currency_pairs"]["data"];
  dates: Response["data"]["currency_pairs"]["dates"];
};

export type Payload = {
  userId: string | undefined;
  base: string;
  filter: "all" | "starred";
  dateFrom?: number;
  dateTo?: number;
  date: number;
  market: "parallel" | "black";
  pageOffset: number;
  pageCount: number;
};

export type Result<S extends boolean | undefined> = {
  data: { is_starred: S; price: number[]; quota: string }[];
  dates: number[];
};

export interface Date_Data {
  quota: string;
  rate: number;
}

export interface DateFrom_Data {
  quota: string;
  rate: number[];
  time: number[];
}

export interface Data {
  quota: string;
  curr_rate: number[];
  prev_rate?: number[];
  time?: number[];
}
