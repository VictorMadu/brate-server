import { headerSchema } from "../schema/header.schema";
import { bodySchema } from "../schema/body.schema";
import { responseSchema } from "../schema/response.schema";
import { ResTuple as _ResTuple } from "../../../../_interfaces";
import { FromSchema } from "json-schema-to-ts";

export type Headers = FromSchema<typeof headerSchema>;
export type Body = FromSchema<typeof bodySchema>;
export type Response = FromSchema<typeof responseSchema>;

export type InData = {
  ids: string[];
};

export type OutData = {
  delete_counts: number;
};

export type ResTuple = _ResTuple<Response["data"]>;
