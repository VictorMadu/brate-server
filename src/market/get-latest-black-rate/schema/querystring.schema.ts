export const querystringSchema = {
  type: "object",
  properties: {
    page_offset: { type: "number" },
    page_count: { type: "number" },
    bases: { type: "string" },
    filter: { enum: ["all", "favourite", "unfavourite"] },
  },

  required: [],
  additionalProperties: false,
} as const;
