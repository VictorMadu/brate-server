import { headerSchema } from "../schema/header.schema";
import { bodySchema } from "../schema/body.schema";
import { res2XXSchema, res4XXSchema } from "../schema/response.schema";
import { ResTuple as _ResTuple } from "../../../_interfaces";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Body = FromSchema<typeof bodySchema>;
export type Res2XX = FromSchema<typeof res2XXSchema>;
export type Res4XX = FromSchema<typeof res4XXSchema>;
