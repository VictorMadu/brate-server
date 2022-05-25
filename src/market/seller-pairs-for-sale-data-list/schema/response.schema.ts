export const res2XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        rates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              pair: { type: "string" },
              rate: { type: "number" },
            },
            additionalProperties: false,
            required: ["pair", "rate"],
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
      required: ["rates", "pagination"],
      additionalProperties: false,
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
