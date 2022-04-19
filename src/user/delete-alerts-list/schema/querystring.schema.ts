// TODO: Limit ids length to 10 per one, one of id or ids
export const querystringSchema = {
  type: "object",
  properties: {
    ids: {
      type: "array",
      items: { type: "string" },
      maxItems: 10,
    },
    id: {
      type: "string",
    },
  },
  additionalProperties: false,
} as const;
