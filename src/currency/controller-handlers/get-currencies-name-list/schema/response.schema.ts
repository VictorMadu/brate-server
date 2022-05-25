export const res2xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        currencies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              short: { type: "string" },
              long: { type: "string" },
            },
            required: ["short", "long"],
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
      required: ["currencies"],
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
