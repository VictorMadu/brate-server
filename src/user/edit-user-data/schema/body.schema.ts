export const bodySchema = {
  type: "object",
  properties: {
    email: { type: "string" },
    name: { type: "string" },
    phone: { type: "string" },
  },
  additionalProperties: false,
} as const;
