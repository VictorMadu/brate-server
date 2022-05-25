export const res2XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        currency_pairs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              pair: { type: "string" },
              rate: { type: "string" },
              prev_rate: { type: "string" },
              is_favourite: { type: "boolean" },
            },
            required: ["pair", "rate", "prev_rate"],
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
      required: ["currency_pairs", "pagination"],
    },
  },
  required: ["status", "msg", "data"],
  additionalProperties: false,
} as const;

export const res4XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
