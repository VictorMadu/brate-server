export const bodySchema = {
  type: "object",
  properties: {
    currency_send: { type: "string" },
    currency_receive: { type: "string" },
    amount_send: { type: "number" },
    seller_id: { type: "string" },
  },

  required: ["currency_send", "currency_receive", "amount_send", "seller_id"],
  additionalProperties: false,
} as const;
