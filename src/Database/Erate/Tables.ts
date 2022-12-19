export const Users = {
    $$NAME: 'users' as 'users',
    user_id: 'user_id' as 'user_id',
    email: 'email' as 'email',
    name: 'name' as 'name',
    password: 'password' as 'password',
    phone: 'phone' as 'phone',
    is_bank: 'is_bank' as 'is_bank',
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

export const RateAlerts = {
    $$NAME: 'rate_alerts' as 'rate_alerts',
    rate_alerts_id: 'rate_alerts_id' as 'rate_alerts_id',
    base: 'base' as 'base',
    quota: 'quota' as 'quota',
    target_rate: 'target_rate' as 'target_rate',
    triggered_at: 'triggered_at' as 'triggered_at',
    created_at: 'created_at' as 'created_at',
    deleted_at: 'deleted_at' as 'deleted_at',
};

export const OfficialRateAlerts = {
    $$NAME: 'official_rate_alerts' as 'official_rate_alerts',
    rate_alerts_id: 'rate_alerts_id' as 'rate_alerts_id',
    user_id: 'user_id' as 'user_id',
};

export const BankRateAlerts = {
    $$NAME: 'bank_rate_alerts' as 'bank_rate_alerts',
    rate_alerts_id: 'rate_alerts_id' as 'rate_alerts_id',
    user_id: 'user_id' as 'user_id',
    bank_user_id: 'bank_user_id' as 'bank_user_id',
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

export const Wallets = {
    $$NAME: 'wallets' as 'wallets',
    user_id: 'user_id' as 'user_id',
    head_transaction_id: 'head_transaction_id' as 'head_transaction_id',
    currency_id: 'currency_id' as 'currency_id',
};

export const Trades = {
    $$NAME: 'trade_id' as 'trade_id',
    trade_id: 'trade_id' as 'trade_id',
    black_rate_id: 'black_rate_id' as 'black_rate_id',
    buyer_id: 'buyer_id' as 'buyer_id',
    from_base_transaction_id: 'from_base_transaction_id' as 'from_base_transaction_id',
    to_base_transaction_id: 'to_base_transaction_id' as 'to_base_transaction_id',
    from_quota_transaction_id: 'from_quota_transaction_id' as 'from_quota_transaction_id',
    to_quota_transaction_id: 'to_quota_transaction_id' as 'to_quota_transaction_id',
};
