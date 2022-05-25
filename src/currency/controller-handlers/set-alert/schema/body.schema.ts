export const bodySchema = {
  type: "object",
  properties: {
    target_rate: { type: "number" },
    market_type: { enum: ["parallel", "black"] },
    base: { type: "string" },
    quota: { type: "string" },
  },

  required: ["target_rate", "base", "quota"],
  additionalProperties: false,
} as const;
