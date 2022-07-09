import { headerSchema } from "../schema/header.schema";
import { querystringSchema } from "../schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Query = FromSchema<typeof querystringSchema>;
export type Res2XX = FromSchema<typeof res2XXSchema>;
export type Res4XX = FromSchema<typeof res4XXSchema>;

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
