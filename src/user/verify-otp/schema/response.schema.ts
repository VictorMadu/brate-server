export const res4xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;

export const res2xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        token: { type: "string" },
        expires_in: { type: "number" },
      },
      required: [],
      additionalProperties: false,
    },
  },
  required: ["status", "msg", "data"],
  additionalProperties: false,
} as const;
