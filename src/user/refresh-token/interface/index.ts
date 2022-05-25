import { res2xxSchema, res4xxSchema } from "../schema/response.schema";
import { headerSchema } from "../schema/header.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Res2xx = FromSchema<typeof res2xxSchema>;
export type Res4xx = FromSchema<typeof res4xxSchema>;
