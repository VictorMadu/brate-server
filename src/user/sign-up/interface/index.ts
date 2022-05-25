import { bodySchema } from "../schema/body.schema";
import { resxxxSchema } from "../schema/response.schema";
import { ResTuple as _ResTuple } from "../../../_interfaces";
import { FromSchema } from "json-schema-to-ts";

export type Body = FromSchema<typeof bodySchema>;
export type ResXXX = FromSchema<typeof resxxxSchema>;
