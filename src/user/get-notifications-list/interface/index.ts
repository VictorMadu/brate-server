import { headerSchema } from "../schema/header.schema";
import { querystringSchema } from "../schema/querystring.schema";
import { responseSchema } from "../schema/response.schema";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Query = FromSchema<typeof querystringSchema>;
export type Response = FromSchema<typeof responseSchema>;
