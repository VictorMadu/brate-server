import { headerSchema } from "../schema/header.schema";
import { querystringSchema } from "../schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";
import { ResTuple as _ResTuple } from "../../../_interfaces";

export type Headers = FromSchema<typeof headerSchema>;
export type Query = FromSchema<typeof querystringSchema>;
export type Res2XX = FromSchema<typeof res2XXSchema>;
export type Res4XX = FromSchema<typeof res4XXSchema>;
