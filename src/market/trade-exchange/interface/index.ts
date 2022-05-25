import { headerSchema } from "../schema/header.schema";
import { bodySchema } from "../schema/body.schema";
import { resXXXSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Body = FromSchema<typeof bodySchema>;
export type ResXXX = FromSchema<typeof resXXXSchema>;
