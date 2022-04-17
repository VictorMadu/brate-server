export const headerSchema = {
  type: "object",
  properties: {
    authorization: {
      type: "string",
      pattern: "^Bearer ",
    },
  },
  additionalProperties: false,
} as const;
