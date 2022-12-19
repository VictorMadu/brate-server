import * as Table from './Tables';

export interface User {
    [Table.Users.user_id]: string;
    [Table.Users.email]: string;
    [Table.Users.name]: string;
    [Table.Users.password]: string;
    [Table.Users.phone]: string;
    [Table.Users.is_bank]: boolean;
    [Table.Users.created_at]: Date;
}

export interface UserVerification {
    [Table.UserVerifications.user_verification_id]: string;
    [Table.UserVerifications.user_id]: string;
    [Table.UserVerifications.otp]: string;
    [Table.UserVerifications.no_of_tries]: number;
    [Table.UserVerifications.created_at]: Date;
    [Table.UserVerifications.verified_at]: Date | null;
}

export interface Notification {
    [Table.Notifications.notification_id]: string;
    [Table.Notifications.user_id]: string;
    [Table.Notifications.msg]: string;
    [Table.Notifications.type]: 'P' | 'F' | 'T';
    [Table.Notifications.created_at]: Date;
    [Table.Notifications.deleted_at]: Date | null;
}

export interface Currency {
    [Table.Currencies.currency_id]: number;
    [Table.Currencies.iso]: string;
    [Table.Currencies.name]: string;
}

export interface UserFavouritePair {
    [Table.UserFavouritePairs.user_favourite_pairs_id]: string;
    [Table.UserFavouritePairs.user_id]: string;
    [Table.UserFavouritePairs.base]: number;
    [Table.UserFavouritePairs.quota]: number;
    [Table.UserFavouritePairs.created_at]: Date;
    [Table.UserFavouritePairs.deleted_at]: Date | null;
}

export interface RateAlert {
    [Table.RateAlerts.rate_alerts_id]: string;
    [Table.RateAlerts.base]: number;
    [Table.RateAlerts.quota]: number;
    [Table.RateAlerts.target_rate]: number;
    [Table.RateAlerts.created_at]: Date;
    [Table.RateAlerts.deleted_at]: Date | null;
    [Table.RateAlerts.triggered_at]: Date | null;
}

export interface OfficialRateAlerts {
    [Table.OfficialRateAlerts.rate_alerts_id]: string;
    [Table.OfficialRateAlerts.user_id]: string;
}

export interface BankRateAlerts {
    [Table.BankRateAlerts.rate_alerts_id]: string;
    [Table.BankRateAlerts.user_id]: string;
    [Table.BankRateAlerts.bank_user_id]: string;
}

export interface ParallelRate {
    [Table.ParallelRates.parallel_rates_id]: number;
    [Table.ParallelRates.currency_id]: number;
    [Table.ParallelRates.rate]: number;
    [Table.ParallelRates.created_at]: number;
}

export interface BlackRate {
    [Table.BlackRates.black_rates_id]: string;
    [Table.BlackRates.user_id]: string;
    [Table.BlackRates.rate]: number;
    [Table.BlackRates.base]: string;
    [Table.BlackRates.quota]: string;
    [Table.BlackRates.created_at]: string;
}

export interface Transactions {
    [Table.Transactions.transaction_id]: string;
    [Table.Transactions.prev_transaction_id]: string;
    [Table.Transactions.amount]: string;
    [Table.Transactions.created_at]: Date;
}

export interface Wallets {
    [Table.Wallets.user_id]: string;
    [Table.Wallets.currency_id]: string;
    [Table.Wallets.head_transaction_id]: string;
}

export interface Trades {
    [Table.Trades.trade_id]: string;
    [Table.Trades.black_rate_id]: string;
    [Table.Trades.buyer_id]: string;
    [Table.Trades.from_base_transaction_id]: string;
    [Table.Trades.to_base_transaction_id]: string;
    [Table.Trades.from_quota_transaction_id]: string;
    [Table.Trades.to_quota_transaction_id]: string;
}
