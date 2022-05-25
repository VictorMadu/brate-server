export const res2XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        traders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              user_id: { type: "string" },
              seller_id: { type: "string" },
              seller_name: { type: "string" },
              pair: { type: "string" },
              rate: { type: "number" },
              amount_available: { type: "number" },
              created_at: { type: "number" },
            },
            additionalProperties: false,
            required: [
              "user_id",
              "seller_id",
              "seller_name",
              "pair",
              "rate",
              "amount_available",
              "created_at",
            ],
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
      required: ["traders", "pagination"],
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
