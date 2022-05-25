import { headerSchema } from "../schema/header.schema";
import { resxxxSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Resxx = FromSchema<typeof resxxxSchema>;
