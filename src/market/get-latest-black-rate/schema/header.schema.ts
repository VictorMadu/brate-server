export const headerSchema = {
  type: "object",
  properties: {
    authorization: {
      type: "string",
      pattern: "^Bearer ",
    },
  },
} as const;
