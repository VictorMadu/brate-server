export const bodySchema = {
  type: "object",
  properties: {
    amount: { type: "number" },
    currency: { type: "string" },
  },
  required: ["amount", "currency"],
  additionalProperties: false,
} as const;
