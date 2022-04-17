export const querystringSchema = {
  type: "object",
  properties: {
    base: { type: "string" },
    date_from: { type: "number" }, //TODO: A valid timestamp,
    date_to: { type: "number" }, //TODO: A valid timestamp,
    date: { type: "number" }, //TODO: A valid timestamp,
    include_favourites: { type: "boolean" },
    pagination_offset: { type: "number" },
    pagaintion_count: { type: "number" },
    market: { enum: ["parallel", "black"] },
    filter: { enum: ["all", "starred"] },
  },

  additionalProperties: false,
} as const;
