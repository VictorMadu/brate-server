import { paramsSchema } from "../schema/param.schema";
import { responseSchema } from "../schema/response.schema";
import { bodySchema } from "../schema/body.schema";
import { ResTuple as _ResTuple } from "../../../_interfaces";
import { FromSchema } from "json-schema-to-ts";

export type Params = FromSchema<typeof paramsSchema>;
export type Body = FromSchema<typeof bodySchema>;
export type Response = FromSchema<typeof responseSchema>;
