import { paramsSchema } from "../schema/param.schema";
import { resxxxSchema } from "../schema/response.schema";
import { ResTuple as _ResTuple } from "../../../_interfaces";
import { FromSchema } from "json-schema-to-ts";

export type Params = FromSchema<typeof paramsSchema>;
export type ResXXX = FromSchema<typeof resxxxSchema>;
