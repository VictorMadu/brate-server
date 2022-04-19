export const querystringSchema = {
  type: "object",
  properties: {
    filter: { enum: ["all", "untriggered", "triggered"] },
    market: { enum: ["parallel", "black"] },
    page_offset: { type: "number" },
    page_count: { type: "number" },
  },

  additionalProperties: false,
} as const;
