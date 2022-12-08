import * as Table from './tables';

export interface User {
    [Table.Users.user_id]: string;
    [Table.Users.email]: string;
    [Table.Users.name]: string;
    [Table.Users.password]: string;
    [Table.Users.phone]: string;
    [Table.Users.created_at]: Date;
}

export interface UserVerification {
    [Table.UserVerifications.user_verification_id]: string;
    [Table.UserVerifications.user_id]: string;
    [Table.UserVerifications.otp]: string;
    [Table.UserVerifications.no_of_tries]: number;
    [Table.UserVerifications.created_at]: Date;
    [Table.UserVerifications.verified_at]: Date;
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
    [Table.Currencies.currency_id]: string;
    [Table.Currencies.iso]: string;
    [Table.Currencies.name]: string;
}

export interface UserFavouritePair {
    [Table.UserFavouritePairs.user_favourite_pairs_id]: string;
    [Table.UserFavouritePairs.user_id]: string;
    [Table.UserFavouritePairs.base]: string;
    [Table.UserFavouritePairs.quota]: string;
    [Table.UserFavouritePairs.created_at]: Date;
    [Table.UserFavouritePairs.deleted_at]: Date | null;
}

export interface PriceAlert {
    [Table.PriceAlerts.price_alert_id]: string;
    [Table.PriceAlerts.user_id]: string;
    [Table.PriceAlerts.market_type]: 'P' | 'B';
    [Table.PriceAlerts.base]: string;
    [Table.PriceAlerts.quota]: string;
    [Table.PriceAlerts.set_rate]: string;
    [Table.PriceAlerts.target_rate]: string;
    [Table.PriceAlerts.created_at]: Date;
    [Table.PriceAlerts.deleted_at]: Date | null;
    [Table.PriceAlerts.triggered_at]: Date | null;
}

export interface ParallelRate {
    [Table.ParallelRates.parallel_rates_id]: string;
    [Table.ParallelRates.currency_id]: number;
    [Table.ParallelRates.rate]: number;
    [Table.ParallelRates.created_at]: number;
}

export interface BlackRate {
    [Table.BlackRates.black_rates_id]: string;
    [Table.BlackRates.user_id]: string;
    [Table.BlackRates.rate]: string;
    [Table.BlackRates.base]: string;
    [Table.BlackRates.quota]: string;
    [Table.BlackRates.created_at]: string;
}

export interface Transactions {
    [Table.Transactions.transaction_id]: string;
    [Table.Transactions.prev_transaction_id]: string;
    [Table.Transactions.amount]: string;
    [Table.Transactions.created_at]: string;
}

export interface TransferTransactions {
    [Table.TransferTransactions.from_transaction_id]: string;
    [Table.TransferTransactions.to_transaction_id]: string;
}

export interface HeadTransactions {
    [Table.HeadTransactions.user_id]: string;
    [Table.HeadTransactions.transaction_id]: string;
    [Table.HeadTransactions.currency_id]: string;
}
