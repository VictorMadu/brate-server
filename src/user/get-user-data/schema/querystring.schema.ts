export const querystringSchema = {
  type: "object",
  properties: {
    include_email: { type: "boolean" },
    include_name: { type: "boolean" },
    include_phone: { type: "boolean" },
  },
  additionalProperties: false,
} as const;
