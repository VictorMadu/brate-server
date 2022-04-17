import { FromSchema } from "json-schema-to-ts";

export const responseSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        currency_pairs: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  quota: { type: "string" },
                  price: {
                    type: "array",
                    items: {
                      type: "number",
                    },
                  },
                  is_starred: { type: "boolean" },
                },
                additionalProperties: false,
                required: ["quota", "price"],
              },
            },
            dates: {
              type: "array",
              items: {
                type: "number",
              },
            },
            base: { type: "string" },
          },
          required: ["base", "dates", "data"],
          additionalProperties: false,
        },
        pagination: {
          type: "object",
          properties: {
            total: { type: "number" },
            skipped: { type: "number" },
            page_count: { type: "number" },
          },
          required: ["total", "skipped", "page_count"],
          additionalProperties: false,
        },
      },
      additionalProperties: false,
      required: ["currency_pairs", "pagination"],
    },
  },
  required: ["status", "msg", "data"],
  additionalProperties: false,
} as const;
