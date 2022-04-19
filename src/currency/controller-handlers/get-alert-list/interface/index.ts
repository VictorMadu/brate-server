import { headerSchema } from "../schema/header.schema";
import { querystringSchema } from "../schema/querystring.schema";
import { responseSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Query = FromSchema<typeof querystringSchema>;
export type Response = FromSchema<typeof responseSchema>;

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
