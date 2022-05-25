export const bodySchema = {
  type: "object",
  properties: {
    rate: { type: "number" },
    base: { type: "string" },
    quota: { type: "string" },
  },

  required: ["base", "quota"],
  additionalProperties: false,
} as const;
