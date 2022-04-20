import { headerSchema } from "currency/controller-handlers/get-currency-pair-list/schema/header.schema";
import { querystringSchema } from "currency/controller-handlers/get-currency-pair-list/schema/querystring.schema";
import { responseSchema } from "currency/controller-handlers/get-currency-pair-list/schema/response.schema";
import { FromSchema } from "json-schema-to-ts";
import { ResTuple as _ResTuple } from "../../../../_interfaces";

export type Headers = FromSchema<typeof headerSchema>;
export type Query = FromSchema<typeof querystringSchema>;
export type Response = FromSchema<typeof responseSchema>;

export type ResTuple = _ResTuple<Response["data"]>;

export type Payload = {
  userId: string | undefined;
  base: string;
  include_favourites: boolean | undefined;
  from: number | undefined;
  market: "parallel" | "black";
  interval: number | undefined;
  steps: number | undefined;
  page_limit: string | undefined;
  page_offset: string | undefined;
};

export type Result<S extends boolean | undefined> = {
  data: { is_starred: S; price: number[]; quota: string }[];
  dates: number[];
};

export type InData = {
  market_type: "parallel" | "black";
  base: string;
  from: number;
  interval: number;
  limit: number;
  offset: number;
  to: number;
};

export type OutData = { quota: string; timestamps: number[]; rates: number[] }[];
