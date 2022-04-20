export const bodySchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    password: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
  },
  required: ["name", "password", "email", "phone"],
  additionalProperties: false,
} as const;
