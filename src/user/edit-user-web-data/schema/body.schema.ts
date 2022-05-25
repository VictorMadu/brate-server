export const bodySchema = {
  type: "object",
  properties: {
    language: { enum: ["English", "French"] },
    remove_trade_notification_after: { type: "number" },
    remove_price_alert_notification_after: { type: "number" },
    remove_fund_notification_after: { type: "number" },
    bereau_de_change: { type: "boolean" },
    dark_mode: { type: "boolean" },
  },
  additionalProperties: false,
} as const;
