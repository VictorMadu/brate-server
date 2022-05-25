import { headerSchema } from "../schema/header.schema";
import { bodySchema } from "../schema/body.schema";
import { res2xxSchema, res4xxSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Body = FromSchema<typeof bodySchema>;
export type Res2xx = FromSchema<typeof res2xxSchema>;
export type Res4xx = FromSchema<typeof res4xxSchema>;
