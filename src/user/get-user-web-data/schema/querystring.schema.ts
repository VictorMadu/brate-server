export const querystringSchema = {
  type: "object",
  properties: {
    include_web_client_id: { type: "boolean" },
    include_language: { type: "boolean" },
    include_remove_trade_notification_after: { type: "boolean" },
    include_remove_price_alert_notification_after: { type: "boolean" },
    include_remove_fund_notification_after: { type: "boolean" },
    include_bereau_de_change: { type: "boolean" },
    include_dark_mode: { type: "boolean" },
  },
  additionalProperties: false,
} as const;
