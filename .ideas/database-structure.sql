CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  user_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, 
  email VARCHAR(64) UNIQUE NOT NULL, 
  name VARCHAR(64) NOT NULL,
  password VARCHAR(64) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_details uuid[] NOT NULL DEFAULT ARRAY[]::uuid[]
);

CREATE TABLE IF NOT EXISTS user_favourite_currency_pairs (
  user_id  uuid NOT NULL,
  base CHAR(3) NOT NULL,
  quota CHAR(3) NOT NULL,
  favourite_at TIMESTAMPTZ[] NOT NULL DEFAULT ARRAY[NOW()]::TIMESTAMPTZ[],
  unfavourite_at TIMESTAMPTZ[] NOT NULL DEFAULT ARRAY[]::TIMESTAMPTZ[],
  PRIMARY KEY (user_id, base, quota)
);

INSERT INTO user_favourite_currency_pairs (user_id, base, quota)
VALUES ('c8d8e578-eed8-4c8e-a6b2-2e1eaf75b46b', 'USD', 'EUR');

CREATE TABLE IF NOT EXISTS user_verification_details (
  user_verification_details_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  one_time_password VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  tried_passwords VARCHAR(11)[]  NOT NULL DEFAULT ARRAY[]::VARCHAR(11)[],  -- The 11th char indicates over entered passwords
  tried_passwords_at TIMESTAMPTZ[]  DEFAULT ARRAY[]::TIMESTAMPTZ[] -- The tried_passwords_at at ith index is for the tried_password at the ith index
);


CREATE TABLE IF NOT EXISTS sellers (
  seller_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, 
  user_id uuid UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, 
  user_id uuid UNIQUE NOT NULL,
  last_checked_time TIMESTAMPTZ [] DEFAULT ARRAY[]::TIMESTAMPTZ[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS parallel_rates (
  time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  rate NUMERIC(16,8), 
  currency_id VARCHAR(3) NOT NULL
);


CREATE TABLE IF NOT EXISTS black_rates (
  seller_id uuid NOT NULL,
  time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  rate NUMERIC(16,8),
  base VARCHAR(3) NOT NULL,
  quota VARCHAR(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS price_alerts (
  price_alert_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_at TIMESTAMPTZ,
  set_rate NUMERIC(16,8) NOT NULL,
  target_rate NUMERIC(16,8) NOT NULL,
  base VARCHAR(3) NOT NULL,
  quota VARCHAR(3) NOT NULL,
  market_type VARCHAR(1) CHECK (market_type IN ('P', 'B')),  -- P for parallel_rates, B for black_rates
  -- is_deleted BOOLEAN DEFAULT 't'
  deleted_at TIMESTAMPTZ
);


CREATE TABLE IF NOT EXISTS transactions (
  transaction_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL, --TODO: reference
  amount NUMERIC(16,8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  currency_id VARCHAR(3),
  transaction_with_id uuid NOT NULL  -- NULL means self funded
);

CREATE TABLE IF NOT EXISTS currencies (
  currency_id VARCHAR(3) NOT NULL PRIMARY KEY,
  full_name VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS web_clients (
  web_client_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  language VARCHAR(16) NOT NULL CHECK(language IN ('English', 'French')),
  notification_check_at TIMESTAMPTZ[] NOT NULL DEFAULT ARRAY[]::TIMESTAMPTZ[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  remove_trade_notification_after BIGINT,
  remove_price_alert_notification_after BIGINT,
  remove_fund_notification_after BIGINT,
  bereau_de_change BOOLEAN DEFAULT 'f',  -- is seller
  dark_mode BOOLEAN DEFAULT 'f'

);

user_id, seller_id, web_clients

CREATE TABLE IF NOT EXISTS notifications (
  notification_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  msg TEXT DEFAULT '',
  user_id uuid NOT NULL,  -- TODO: reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  type CHAR(1) NOT NULL CHECK(type IN ('P',  'T', 'F'))   -- `P` => Price Alert `T` => Trade  `F` => Fund 
);


ALTER TABLE user_favourite_currency_pairs ADD FOREIGN KEY(user_id) REFERENCES users(user_id);
ALTER TABLE customers ADD FOREIGN KEY(user_id) REFERENCES users(user_id);
ALTER TABLE sellers ADD FOREIGN KEY(user_id) REFERENCES users(user_id);
ALTER TABLE parallel_rates ADD FOREIGN KEY(currency_id) REFERENCES currencies(currency_id);
ALTER TABLE black_rates ADD  FOREIGN KEY(seller_id) REFERENCES sellers(seller_id);

ALTER TABLE black_rates 
ADD FOREIGN KEY(base) REFERENCES currencies(currency_id),
ADD FOREIGN KEY(quota) REFERENCES currencies(currency_id);
ALTER TABLE price_alerts ADD FOREIGN KEY(user_id) REFERENCES users(user_id);

ALTER TABLE transactions 
ADD FOREIGN KEY(currency_id) REFERENCES currencies(currency_id),
ADD FOREIGN KEY(user_id) REFERENCES users(user_id), 
ADD FOREIGN KEY (transaction_with_id) REFERENCES users(user_id);

ALTER TABLE web_clients 
ADD FOREIGN KEY(user_id) REFERENCES users(user_id);
