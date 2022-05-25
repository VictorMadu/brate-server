export const res2XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        deleted_count: { type: "number" },
      },
      required: ["deleted_count"],
      additionalProperties: false,
    },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;

export const res4XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        deleted_count: { type: "number" },
      },
      required: ["deleted_count"],
      additionalProperties: false,
    },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
