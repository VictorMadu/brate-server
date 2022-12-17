export const Users = {
    $$NAME: 'users' as 'users',
    user_id: 'user_id' as 'user_id',
    email: 'email' as 'email',
    name: 'name' as 'name',
    password: 'password' as 'password',
    phone: 'phone' as 'phone',
    created_at: 'created_at' as 'created_at',
};

export const UserVerifications = {
    $$NAME: 'user_verifications' as 'user_verifications',
    user_verification_id: 'user_verification_id' as 'user_verification_id',
    user_id: 'user_id' as 'user_id',
    otp: 'otp' as 'otp',
    no_of_tries: 'no_of_tries' as 'no_of_tries',
    created_at: 'created_at' as 'created_at',
    verified_at: 'verified_at' as 'verified_at',
};

export const Notifications = {
    $$NAME: 'notifications' as 'notifications',
    notification_id: 'notification_id' as 'notification_id',
    user_id: 'user_id' as 'user_id',
    msg: 'msg' as 'msg',
    type: 'type' as 'type',
    created_at: 'created_at' as 'created_at',
    deleted_at: 'deleted_at' as 'deleted_at',
};

export const Currencies = {
    $$NAME: 'currencies' as 'currencies',
    currency_id: 'currency_id' as 'currency_id',
    iso: 'iso' as 'iso',
    name: 'name' as 'name',
};

export const UserFavouritePairs = {
    $$NAME: 'currencies' as 'currencies',
    user_favourite_pairs_id: 'user_favourite_pairs_id' as 'user_favourite_pairs_id',
    user_id: 'user_id' as 'user_id',
    base: 'base' as 'base',
    quota: 'quota' as 'quota',
    created_at: 'created_at' as 'created_at',
    deleted_at: 'deleted_at' as 'deleted_at',
};

export const PriceAlerts = {
    $$NAME: 'price_alerts' as 'price_alerts',
    price_alert_id: 'price_alert_id' as 'price_alert_id',
    user_id: 'user_id' as 'user_id',
    market_type: 'market_type' as 'market_type',
    base: 'base' as 'base',
    quota: 'quota' as 'quota',
    set_rate: 'set_rate' as 'set_rate',
    target_rate: 'target_rate' as 'target_rate',
    triggered_at: 'triggered_at' as 'triggered_at',
    created_at: 'created_at' as 'created_at',
    deleted_at: 'deleted_at' as 'deleted_at',
};

export const ParallelRates = {
    $$NAME: 'parallel_rates' as 'parallel_rates',
    parallel_rates_id: 'parallel_rates_id' as 'parallel_rates_id',
    currency_id: 'currency_id' as 'currency_id',
    rate: 'rate' as 'rate',
    created_at: 'created_at' as 'created_at',
};

export const BlackRates = {
    $$NAME: 'black_rates' as 'black_rates',
    black_rates_id: 'black_rates_id' as 'black_rates_id',
    user_id: 'user_id' as 'user_id',
    rate: 'rate' as 'rate',
    base: 'base' as 'base',
    quota: 'quota' as 'quota',
    created_at: 'created_at' as 'created_at',
};

export const Transactions = {
    $$NAME: 'transactions' as 'transactions',
    transaction_id: 'transaction_id' as 'transaction_id',
    prev_transaction_id: 'prev_transaction_id' as 'prev_transaction_id',
    amount: 'amount' as 'amount',
    created_at: 'created_at' as 'created_at',
};

export const Trades = {
    $$NAME: 'trade_id' as 'trade_id',
    black_rate_id: 'black_rate_id' as 'black_rate_id',
    buyer_id: 'buyer_id' as 'buyer_id',
    from_base_transaction_id: 'from_base_transaction_id' as 'from_base_transaction_id',
    to_base_transaction_id: 'to_base_transaction_id' as 'to_base_transaction_id',
    from_quota_transaction_id: 'from_quota_transaction_id' as 'from_quota_transaction_id',
    to_quota_transaction_id: 'to_quota_transaction_id' as 'to_quota_transaction_id',
};

export const Wallets = {
    $$NAME: 'wallet' as 'wallet',
    user_id: 'user_id' as 'user_id',
    transaction_id: 'transaction_id' as 'transaction_id',
    currency_id: 'currency_id' as 'currency_id',
};
