export const parallelRates = {
  $$NAME: "parallel_rates" as "parallel_rates",
  time: "time" as "time",
  rate: "rate" as "rate",
  currency_id: "currency_id" as "currency_id",
};

export const blackRates = {
  $$NAME: "black_rates" as "black_rates",
  seller_id: "seller_id" as "seller_id",
  rate: "rate" as "rate",
  base: "base" as "base",
  quota: "quota" as "quota",
  time: "time" as "time",
};

export const users = {
  $$NAME: "users" as "users",
  user_id: "user_id" as "user_id",
  email: "email" as "email",
  name: "name" as "name",
  password: "password" as "password",
  phone: "phone" as "phone",
  favourite_currency_pairs: "favourite_currency_pairs" as "favourite_currency_pairs",
  created_at: "created_at" as "created_at",
  wallet_id: "wallet_id" as "wallet_id",
  verification_details: "verification_details" as "verification_details",
};

export const user_verification_details = {
  $$NAME: "user_verification_details" as "user_verification_details",
  user_verification_details_id: "user_verification_details_id" as "user_verification_details_id",
  one_time_password: "one_time_password" as "one_time_password",
  created_at: "created_at" as "created_at",
  tried_passwords: "tried_passwords" as "tried_passwords",
  tried_passwords_at: "tried_passwords_at" as "tried_passwords_at",
};

export const user_favourite_currency_pairs = {
  $$NAME: "user_favourite_currency_pairs" as "user_favourite_currency_pairs",
  user_id: "user_id" as "user_id",
  base: "base" as "base",
  quota: "quota" as "quota",
  favourite_at: "favourite_at" as "favourite_at",
  unfavourite_at: "unfavourite_at" as "unfavourite_at",
};

export const sellers = {
  $$NAME: "sellers" as "sellers",
  user_id: "user_id" as "user_id",
  last_checked_time: "last_checked_time" as "last_checked_time",
  created_at: "created_at" as "created_at",
  seller_id: "seller_id" as "seller_id",
};

export const customers = {
  $$NAME: "customers" as "customers",
  user_id: "user_id" as "user_id",
  last_checked_time: "last_checked_time" as "last_checked_time",
  created_at: "created_at" as "created_at",
  customer_id: "customer_id" as "customer_id",
};

export const currencies = {
  $$NAME: "currencies" as "currencies",
  currency_id: "currency_id" as "currency_id",
  full_name: "full_name" as "full_name",
};

export const price_alerts = {
  $$NAME: "price_alerts" as "price_alerts",
  price_alert_id: "price_alert_id" as "price_alert_id",
  user_id: "user_id" as "user_id",
  created_at: "created_at" as "created_at",
  triggered_at: "triggered_at" as "triggered_at",
  set_rate: "set_rate" as "set_rate",
  target_rate: "target_rate" as "target_rate",
  base: "base" as "base",
  quota: "quota" as "quota",
  deleted_at: "deleted_at" as "deleted_at",
  market_type: "market_type" as "market_type",
};

// TODO: Rename to transactions. Remember this will lead to breaking changes
export const wallet_currency_transactions = {
  $$NAME: "transactions" as "transactions",
  transaction_id: "transaction_id" as "transaction_id",
  user_id: "user_id" as "user_id",
  amount: "amount" as "amount",
  currency_id: "currency_id" as "currency_id",
  created_at: "created_at" as "created_at",
  transaction_with_id: "transaction_with_id" as "transaction_with_id",
};

export const notifications = {
  $$NAME: "notifications" as "notifications",
  notification_id: "notification_id" as "notification_id",
  msg: "msg" as "msg",
  created_at: "created_at" as "created_at",
  user_id: "user_id" as "user_id",
  deleted_at: "deleted_at" as "deleted_at",
  type: "type" as "type",
  notification_type_id: "notification_type_id" as "notification_type_id",
};

// TODO: Remove notification after
export const web_clients = {
  $$NAME: "web_clients" as "web_clients",
  web_client_id: "web_client_id" as "web_client_id",
  user_id: "user_id" as "user_id",
  language: "language" as "language",
  created_at: "created_at" as "created_at",
  remove_trade_notification_after: "remove_trade_notification_after" as "remove_trade_notification_after",
  remove_price_alert_notification_after: "remove_price_alert_notification_after" as "remove_price_alert_notification_after",
  remove_fund_notification_after: "remove_fund_notification_after" as "remove_fund_notification_after",
  bereau_de_change: "bereau_de_change" as "bereau_de_change",
  notification_check_at: "notification_check_at" as "notification_check_at",
  dark_mode: "dark_mode" as "dark_mode",
};
