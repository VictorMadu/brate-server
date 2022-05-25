// TODO: Limit ids length to 10 per one, one of id or ids
export const querySchema = {
  type: "object",
  properties: {
    ids: { type: "string" },
  },
  required: ["ids"],
  additionalProperties: false,
} as const;
