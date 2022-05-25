// TODO: Limit ids length to 10 per one, one of id or ids
export const querySchema = {
  type: "object",
  properties: {
    ids: {
      type: "array",
      items: { type: "string" },
      maxItems: 10,
    },
  },
  required: ["ids"],
  additionalProperties: false,
} as const;
