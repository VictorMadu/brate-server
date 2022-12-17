import { QueryResult } from 'pg';
import { Runner } from '../../Application/Common/Interfaces/Database/Runner';
import {
    BlackRates,
    Currencies,
    PriceAlerts,
    Trades,
    Transactions,
    Users,
    Wallets,
} from '../../Database/Erate/Tables';
import _ from 'lodash';

export enum Operation {
    CREDIT = '+',
    DEBIT = '-',
}

interface MultipleUnqiue {
    userId: string;
    baseCurrencyId: string;
    quotaCurrencyId: string;
}

export default class TradeRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async obtainDetails(inData: { blackMarketTradeId: string; buyerUserId: string }) {
        const result: QueryResult<{
            buyer_user_id: string;
            buyer_user_name: string;
            seller_user_id: string;
            seller_user_name: string;
            base_currency_id: string;
            base_currency_abbrev: string;
            quota_currency_id: string;
            quota_currency_abrev: string;
            rate: string;
            created_at: Date;
        }> = await this.runner.run(
            TradeRepository.ObtainBlackRateQuery,
            inData.blackMarketTradeId,
            inData.buyerUserId,
        );

        const row = result.rows[0];

        return {
            buyerUserId: row.buyer_user_id,
            buyerUserName: row.buyer_user_name,
            sellerUserId: row.seller_user_id,
            sellerUserName: row.seller_user_name,
            baseCurrencyId: row.base_currency_id,
            baseCurrencyAbbrev: row.base_currency_abbrev,
            quotaCurrencyId: row.quota_currency_id,
            quotaCurrencyAbrev: row.quota_currency_abrev,
            rate: row.rate,
            createdAt: row.created_at,
        };
    }

    async updateBalance(inData: {
        userId: string;
        currencyId: string;
        amountToMoveInBaseCurrency: string;
        multipler: string;
        operation: Operation;
    }) {
        const queryResult: QueryResult<{
            amount_remaining: string;
            amount_moved: string;
            transaction_id: string;
        }> = await this.runner.run(
            TradeRepository.UpdateBalanceQuery,
            inData.userId,
            inData.currencyId,
            inData.amountToMoveInBaseCurrency,
            inData.multipler,
            inData.operation,
        );

        const row = queryResult.rows[0];

        return {
            transactionId: row.transaction_id,
            amountMoved: row.amount_moved,
            amountLeft: row.amount_remaining,
        };
    }

    async saveTrade(inData: {
        blackRateId: string;
        buyerUserId: string;
        transaction: {
            fromBaseId: string;
            toBaseId: string;
            fromQuotaId: string;
            toQuotaId: string;
        };
    }) {
        const queryResult: QueryResult<{ trade_id: string }> = await this.runner.run(
            TradeRepository.SaveTradeQuery,
            inData.blackRateId,
            inData.buyerUserId,
            inData.transaction.fromBaseId,
            inData.transaction.toBaseId,
            inData.transaction.fromQuotaId,
            inData.transaction.toQuotaId,
        );

        const row = queryResult.rows[0];

        return {
            tradeId: row.trade_id,
        };
    }

    private static ObtainBlackRateQuery = `
        WITH in_data AS (SELECT * FROM  (VALUES (%L, %L)) AS t(black_rates_id, buyer_user_id))

        SELECT 
            b.${BlackRates.black_rates_id} black_rates_id,
            buyer_user.${Users.user_id} buyer_user_id,
            buyer_user.${Users.name} buyer_user_name,
            seller_user.${Users.user_id} seller_user_id,
            seller_user.${Users.name} seller_user_name,
            base_currency.${Currencies.currency_id} base_currency_id,
            base_currency.${Currencies.iso} base_currency_abbrev,
            quota_currency.${Currencies.currency_id} quota_currency_id,
            quota_currency.${Currencies.iso} quota_currency_abbrev,
            b.${BlackRates.rate} rate,
            b.${BlackRates.created_at} created_at
        FROM 
            ${BlackRates.$$NAME} b
        LEFT JOIN 
            ${Currencies.$$NAME} base_currency
        ON 
            base_currency.${Currencies.currency_id} = b.${BlackRates.base}
        LEFT JOIN
            ${Currencies.$$NAME} quota_currency
        ON 
            quota_currency.${Currencies.currency_id} = b.${BlackRates.quota}
        LEFT JOIN
            ${Users.$$NAME} buyer_user
        ON 
            buyer_user.${Users.user_id} = IN (SELECT buyer_user_id FROM in_data)
        LEFT JOIN
            ${Users.$$NAME} seller_user
        ON 
            seller_user.${Users.user_id} = b.${BlackRates.user_id}
        WHERE
            b.${BlackRates.black_rates_id} = IN (SELECT black_rates_id FROM in_data)
    `;

    private static UpdateBalanceQuery = `
        WITH in_data AS (SELECT * FROM  (VALUES (%L, %L, (%L)::NUMERIC, (%L)::numeric)) AS t(user_id, currency_id, amount_moved, multiplier)),

             temp_user AS (SELECT user_id, currency_id, amount_moved * multipler amount_moved FROM in_data),

            temp_transaction AS (
                INSERT INTO ${Transactions.$$NAME}
                (
                    ${Transactions.prev_transaction_id},
                    ${Transactions.amount},
                )
                SELECT 
                    w.${Wallets.head_transaction_id},
                    COALESCE(t.${Transactions.amount}, 0) %s (SELECT amount_moved FROM temp_user) 
                FROM 
                    ${Wallets.$$NAME} w
                LEFT JOIN 
                    ${Transactions.$$NAME} t
                ON 
                    w.${Wallets.head_transaction_id} = t.${Transactions.transaction_id}
                RETURNING 
                    ${Transactions.transaction_id} transaction_id,
                    ${Transactions.amount} amount_remaining,
                    (SELECT user_id FROM temp_user) user_id, 
                    (SELECT currency_id FROM temp_user) currency_id,
                    (SELECT amount_moved FROM temp_user) amount_moved,
            )

            INSERT INTO ${Wallets.$$NAME}
            (
                ${Wallets.user_id},
                ${Wallets.currency_id},
                ${Wallets.head_transaction_id}
            )
            VALUES (
                SELECT 
                    user_id, currency_id, transaction_id 
                FROM 
                    temp_transaction
            )
            ON CONFLICT(user_id, currency_id)
            DO UPDATE
            SET
                ${Wallets.head_transaction_id} = EXCLUDED.${Wallets.head_transaction_id}
            RETURNING 
                (SELECT transaction_id FROM temp_transaction) transaction_id,
                (SELECT amount_remaining, FROM temp_transaction) amount_remaining,
                (SELECT amount_moved, FROM temp_transaction) amount_moved,
    `;

    private static SaveTradeQuery = `
        WITH transaction_details AS (
            SELECT (
                VALUES (%L, %L, %L, %L, %L, %L)
            ) 
            AS t(
                black_rate_id, 
                buyer_user_id, 
                from_base_transaction_id,
                to_base_transaction_id,
                from_quota_transaction_id,
                to_quota_transaction_id
            )
        )

        INSERT INTO ${Trades.$$NAME}
        (
            ${Trades.black_rate_id},
            ${Trades.buyer_id},
            ${Trades.from_base_transaction_id},
            ${Trades.to_base_transaction_id},
            ${Trades.from_quota_transaction_id},
            ${Trades.to_quota_transaction_id}
        )
        SELECT *
        FROM transaction_details
        RETURNING 
            ${Trades.trade_id} trade_id
    `;
}
