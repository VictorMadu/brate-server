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
                  rates: {
                    type: "array",
                    items: {
                      type: "number",
                    },
                  },
                  timestamps: {
                    type: "array",
                    items: {
                      type: "number",
                    },
                  },
                },
                additionalProperties: false,
                required: ["quota", "rates", "timestamps"],
              },
            },
            favourites: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  base: { type: "string" },
                  quota: { type: "string" },
                },
                additionalProperties: false,
                required: ["base", "quota"],
              },
            },
            base: { type: "string" },
          },
          required: ["base", "favourites", "data"],
          additionalProperties: false,
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
      required: ["currency_pairs", "pagination"],
    },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
