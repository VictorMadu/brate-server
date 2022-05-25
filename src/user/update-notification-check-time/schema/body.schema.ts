export const bodySchema = {
  type: "object",
  properties: {
    last_check_time: { type: "number" },
  },
  required: ["last_check_time"],
  additionalProperties: false,
} as const;
