import { querySchema } from "../schema/query.schema";
import { res2xxSchema, res4xxSchema } from "../schema/response.schema";
import { headerSchema } from "../schema/header.schema";
import { ResTuple as _ResTuple } from "../../../_interfaces";
import { FromSchema } from "json-schema-to-ts";

export type Query = FromSchema<typeof querySchema>;
export type Res2xx = FromSchema<typeof res2xxSchema>;
export type Res4xx = FromSchema<typeof res4xxSchema>;
export type Header = FromSchema<typeof headerSchema>;
