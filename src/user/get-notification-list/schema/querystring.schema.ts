export const querystringSchema = {
  type: "object",
  properties: {
    type: { enum: ["P", "T", "F"] },
    page_offset: { type: "number" },
    page_count: { type: "number" },
    from: { type: "number" },
    to: { type: "number" },
  },

  additionalProperties: false,
} as const;
