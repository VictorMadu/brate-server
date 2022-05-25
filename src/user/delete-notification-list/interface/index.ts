import { headerSchema } from "../schema/header.schema";
import { querySchema } from "../schema/query.schema";
import { res2xxSchema, res4xxSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Query = FromSchema<typeof querySchema>;
export type Res2xx = FromSchema<typeof res2xxSchema>;
export type Res4xx = FromSchema<typeof res4xxSchema>;

export type InData = {
  userId: string;
  filter: "all" | "untriggered" | "triggered";
  market_type: "parallel" | "black";
  limit: number;
  offset: number;
};

export type OutData = {
  id: string;
  base: string;
  quota: string;
  target_rate: number;
  created_rate: number;
  created_at: number;
  triggered_at: number;
};
