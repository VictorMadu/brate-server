export const querystringSchema = {
  type: "object",
  properties: {
    base: { type: "string" },
    from: { type: "number" }, //TODO: A valid timestamp,
    include_favourites: { type: "boolean" },
    market: { enum: ["parallel", "black"] },
    steps: { type: "number" },
    interval: { type: "number" },
    page_offset: { type: "number" },
    page_count: { type: "number" },
  },

  additionalProperties: false,
} as const;
