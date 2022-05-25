import { FromSchema } from "json-schema-to-ts";

export const res2xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        token: { type: "string" },
        expires_in: { type: "number" },
      },
      required: ["token", "expires_in"],
      additionalProperties: false,
    },
  },
  required: ["status", "msg", "data"],
  additionalProperties: false,
} as const;

export const res4xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
