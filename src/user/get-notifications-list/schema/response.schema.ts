import { FromSchema } from "json-schema-to-ts";

export const responseSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        notifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              msg: { type: "string" },
              created_at: { type: "number" },
              type: { enum: ["P", "T", "F"] },
            },
            required: ["id", "msg", "created_at", "type"],
            additionalProperties: false,
          },
        },
        pagination: {
          type: "object",
          properties: {
            skipped: { type: "number" },
            page_count: { type: "number" },
          },
          required: ["skipped", "page_count"],
          additionalProperties: false,
        },
      },
      additionalProperties: false,
      required: ["notifications", "pagination"],
    },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
