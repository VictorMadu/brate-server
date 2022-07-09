export const res2XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        alerts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              base: { type: "string" },
              quota: { type: "string" },
              target_rate: { type: "number" },
              created_rate: { type: "number" },
              created_at: { type: "number" },
              triggered_at: { type: ["number", "null"] },
            },
            required: [
              "id",
              "base",
              "quota",
              "created_rate",
              "target_rate",
              "created_at",
              "triggered_at",
            ],
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
      required: ["alerts", "pagination"],
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
