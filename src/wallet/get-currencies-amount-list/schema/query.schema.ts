export const querySchema = {
  type: "object",
  properties: {
    currencies: {
      type: ["string", "array"],
      items: {
        type: "string",
      },
    },
    page_offset: { type: "number" },
    page_count: { type: "number" },
  },
  additionalProperties: false,
} as const;
