CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  user_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY, 
  email VARCHAR(64) UNIQUE NOT NULL, 
  name VARCHAR(64) NOT NULL,
  password VARCHAR(64) NOT NULL,
  phone VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_verifications (
  user_verification_id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  otp VARCHAR(64) NOT NULL,
  no_of_tries INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);


ALTER TABLE user_verifications ADD FOREIGN KEY(user_id) REFERENCES users(user_id);

-- About the table
-- About each fields and data type and why the field and datatype

CREATE TABLE IF NOT EXISTS currencies (
  currency_id INT UNIQUE GENERATED ALWAYS AS IDENTITY,
  iso CHAR(3) NOT NULL PRIMARY KEY,
  name VARCHAR(64)
);


CREATE TABLE IF NOT EXISTS user_favourite_pairs (
  user_favourite_pairs_id  uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id  uuid UNIQUE NOT NULL,
  base INT NOT NULL,
  quota INT NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (user_id, base, quota)
);

ALTER TABLE user_favourite_pairs 
ADD FOREIGN KEY(user_id) REFERENCES users(user_id),
ADD CONSTRAINT base_quota_diff_check CHECK (base <> quota);


CREATE TABLE IF NOT EXISTS parallel_rates (
  parallel_rates_id INT UNIQUE GENERATED ALWAYS AS IDENTITY,
  currency_id INT NOT NULL,
  rate NUMERIC(16,6), 
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE parallel_rates ADD FOREIGN KEY(currency_id) REFERENCES currencies(currency_id);

CREATE TABLE IF NOT EXISTS black_rates (
  black_rates_id  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  rate NUMERIC(16,6),
  base INT NOT NULL,
  quota INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE black_rates 
ADD FOREIGN KEY(base) REFERENCES currencies(currency_id),
ADD FOREIGN KEY(quota) REFERENCES currencies(currency_id),
ADD FOREIGN KEY(user_id) REFERENCES users(user_id),
ADD CONSTRAINT base_quota_diff_check CHECK (base <> quota);

CREATE TABLE IF NOT EXISTS price_alerts (
  price_alert_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,  
  target_rate NUMERIC(16,6) NOT NULL,
  base INT NOT NULL,
  quota INT NOT NULL,
  market_type CHAR(1) CHECK (market_type IN ('P', 'B')),  -- P for parallel_rates, B for black_rates
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

ALTER TABLE price_alerts ADD FOREIGN KEY(user_id) REFERENCES users(user_id);


--  =============================================== transactions ===========================================================
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  prev_transaction_id uuid,  -- NULL means this is the first user transactions for currency_id
  amount NUMERIC(22,8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions 
ADD FOREIGN KEY (prev_transaction_id) REFERENCES transactions(transaction_id),
ADD CONSTRAINT valid_transaction_amount_check CHECK (amount >= 0);

--  =============================================== transfer_transactions ===========================================================

CREATE TABLE IF NOT EXISTS trades (
  trade_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  black_rate_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  from_base_transaction_id  uuid NOT NULL,
  to_base_transaction_id uuid NOT NULL,
  from_quota_transaction_id  uuid NOT NULL,
  to_quota_transaction_id uuid NOT NULL
);

-- TODO: Add checks for transaction_id s

ALTER TABLE trades 
ADD FOREIGN KEY (black_rate_id) REFERENCES black_rates(black_rates_id),
ADD FOREIGN KEY (buyer_id) REFERENCES users(user_id),
ADD FOREIGN KEY (from_base_transaction_id) REFERENCES transactions(transaction_id),
ADD FOREIGN KEY (to_base_transaction_id) REFERENCES transactions(transaction_id),
ADD FOREIGN KEY (from_quota_transaction_id) REFERENCES transactions(transaction_id),
ADD FOREIGN KEY (to_quota_transaction_id) REFERENCES transactions(transaction_id);


--  =============================================== wallets ===========================================================

CREATE TABLE wallets (
  user_id uuid NOT NULL, 
  transaction_id uuid NOT NULL,
  currency_id INT NOT NULL
);

ALTER TABLE wallets
ADD FOREIGN KEY (user_id) REFERENCES users(user_id),
ADD FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
ADD FOREIGN KEY (currency_id) REFERENCES currencies(currency_id);

CREATE UNIQUE INDEX unique_wallets_idx ON wallets(user_id, currency_id);


CREATE TABLE IF NOT EXISTS notifications (
  notification_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,  -- TODO: reference
  msg TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  type CHAR(1) NOT NULL CHECK(type IN ('P',  'T', 'F'))   -- `P` => Price Alert `T` => Trade  `F` => Fund 
);


ALTER TABLE notifications
ADD FOREIGN KEY (user_id) REFERENCES users(user_id);


WITH _user AS (SELECT * FROM users WHERE type = 'A' LIMIT 1)
INSERT INTO emails (user_id, email)
SELECT user_id, 'test' FROM _user
WHERE EXISTS (SELECT * FROM _user)
RETURNING user_id;


