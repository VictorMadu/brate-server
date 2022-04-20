export const paramsSchema = {
  type: "object",
  properties: {
    email: {
      type: "string",
    },
  },

  required: ["email"],
  additionalProperties: false,
} as const;
