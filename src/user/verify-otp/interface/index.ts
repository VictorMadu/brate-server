import { paramsSchema } from "../schema/param.schema";
import { res4xxSchema, res2xxSchema } from "../schema/response.schema";
import { bodySchema } from "../schema/body.schema";
import { ResTuple as _ResTuple } from "../../../_interfaces";
import { FromSchema } from "json-schema-to-ts";

export type Params = FromSchema<typeof paramsSchema>;
export type Body = FromSchema<typeof bodySchema>;
export type Res2xx = FromSchema<typeof res2xxSchema>;
export type Res4xx = FromSchema<typeof res4xxSchema>;
