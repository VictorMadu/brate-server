export const res2xxSchema = {
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
              type: { enum: ["P", "T", "F"] },
              msg: { type: "string" },
              created_at: { type: "number" },
            },
            required: ["id", "msg", "type", "created_at"],
            additionalProperties: false,
          },
        },
        count_from_last_check: { type: "number" },
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
      required: ["notifications", "pagination", "count_from_last_check"],
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
