export const res2xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        wallet: {
          type: "array",
          items: {
            type: "object",
            properties: {
              currency: { type: "string" },
              amount: { type: "number" },
            },
            required: ["currency", "amount"],
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
      required: ["wallet", "pagination"],
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
