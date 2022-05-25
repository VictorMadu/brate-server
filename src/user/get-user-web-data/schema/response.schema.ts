export const res2xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
    data: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        web_client_id: { type: "string" },
        language: { enum: ["English", "French"] },
        remove_trade_notification_after: { type: "number" },
        remove_price_alert_notification_after: { type: "number" },
        remove_fund_notification_after: { type: "number" },
        bereau_de_change: { type: "boolean" },
        dark_mode: { type: "boolean" },
      },
      required: ["user_id"],
      additionalProperties: false,
    },
  },
  required: ["status", "msg", "data"],
  additionalProperties: false,
} as const;

export const res4xxSchema = {
  type: "object",
  properties: {
    status: { type: "boolean" },
    msg: { type: "string" },
  },
  required: ["status", "msg"],
  additionalProperties: false,
} as const;
