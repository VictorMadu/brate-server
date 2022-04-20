import { FromSchema } from "json-schema-to-ts";

export const responseSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        token: { type: "string" },
      },
      required: ["token"],
      additionalProperties: false,
    },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
