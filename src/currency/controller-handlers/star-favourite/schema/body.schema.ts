// TODO: Limit ids length to 10 per one, one of id or ids
export const bodySchema = {
  type: "object",
  properties: {
    currency_pairs: {
      type: ["string", "array"],
      items: { type: "string" },
      maxItems: 10,
    },
  },
  required: ["currency_pairs"],
  additionalProperties: false,
} as const;
