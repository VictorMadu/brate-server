export const res2XXSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        inserted_count: { type: "number" },
      },
      required: ["inserted_count"],
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
