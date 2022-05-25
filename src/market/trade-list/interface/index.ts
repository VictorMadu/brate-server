import { FromSchema } from "json-schema-to-ts";
import { querystringSchema } from "../schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "../schema/response.schema";

export type Query = FromSchema<typeof querystringSchema>;
export type Res2xx = FromSchema<typeof res2XXSchema>;
export type Res4xx = FromSchema<typeof res4XXSchema>;
