export const querystringSchema = {
  type: "object",
  properties: {
    from: { type: "number" },
    to: { type: "number" },
    page_offset: { type: "number" },
    page_count: { type: "number" },
    type: { enum: ["P", "T", "F"] },
  },

  additionalProperties: false,
} as const;
