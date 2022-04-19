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
  verified_at: "verified_at" as "verified_at",
  wallet_id: "wallet_id" as "wallet_id",
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
  is_deleted: "is_deleted" as "is_deleted",
  market_type: "market_type" as "market_type",
};
