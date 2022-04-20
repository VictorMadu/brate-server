export const bodySchema = {
  type: "object",
  properties: {
    otp: {
      type: "string",
    },
    include_token: {
      type: "boolean",
    },
  },

  required: ["otp"],
  additionalProperties: false,
} as const;
