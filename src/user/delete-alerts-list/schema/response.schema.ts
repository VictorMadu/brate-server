import { FromSchema } from "json-schema-to-ts";

export const responseSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        delete_count: { type: "number" },
      },
      required: ["delete_count"],
      additionalProperties: false,
    },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
