// TODO: Limit ids length to 10 per one, one of id or ids
export const bodySchema = {
    type: "object",
    properties: {
        ids: { type: "array", items: { type: "string" } },
    },
    required: ["ids"],
    additionalProperties: false,
} as const;
