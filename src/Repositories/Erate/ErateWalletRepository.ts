import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Wallets, Transactions, Currencies } from '../../Database/Erate/Tables';
import _ from 'lodash';

// TODO: Use PL/PGPSQL to obtain caching of query plans
export default class WalletRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async fund(inData: { userId: string; currencyId: number; amountToFund: string }): Promise<{
        headTransactionId: string;
        amountAvailable: string;
        amountAdded: string;
        currencyAbbrev: string;
    }> {
        const result: QueryResult<{
            head_transaction_id: string;
            amount_available: string;
            amount_transacted: string;
            currency_iso: string;
        }> = await this.runner.run(
            WalletRepository.TransactionQuery,
            inData.userId,
            inData.currencyId,
            inData.amountToFund,
            '+',
        );

        const row = result.rows[0];
        return {
            headTransactionId: row.head_transaction_id,
            amountAvailable: row.amount_available,
            amountAdded: row.amount_available,
            currencyAbbrev: row.currency_iso,
        };
    }

    async withdraw(inData: {
        userId: string;
        currencyId: number;
        amountToWithdraw: string;
    }): Promise<{
        headTransactionId: string;
        amountAvailable: string;
        amountRemoved: string;
        currencyAbbrev: string;
    }> {
        const result: QueryResult<{
            head_transaction_id: string;
            amount_available: string;
            amount_transacted: string;
            currency_iso: string;
        }> = await this.runner.run(
            WalletRepository.TransactionQuery,
            inData.userId,
            inData.currencyId,
            inData.amountToWithdraw,
            '-',
        );

        const row = result.rows[0];
        return {
            headTransactionId: row.head_transaction_id,
            amountAvailable: row.amount_available,
            amountRemoved: row.amount_transacted,
            currencyAbbrev: row.currency_iso,
        };
    }

    // TODO: A runner method for row == null ? null : mapper(row[0])
    async obtainHead(inData: {
        currencyId: string;
        userId: string;
    }): Promise<{ transactionId: string; currencyId: number; amountAvailable: string }> {
        const result: QueryResult<{
            transaction_id: string;
            currency_id: number;
            amount_available: string;
        }> = await this.runner.run(
            WalletRepository.GetHeadTransactionQuery,
            inData.userId,
            inData.currencyId,
        );

        const row = result.rows[0];
        return {
            transactionId: row.transaction_id,
            currencyId: row.currency_id,
            amountAvailable: row.amount_available,
        };
    }

    async getChainedDetails(filters: {
        userId: string;
        currencyIds?: number[];
        historySize: number;
    }): Promise<
        {
            userId: string;
            currencyId: string;
            transactionIds: string[];
            amounts: string[];
            levels: number[];
            createdAts: Date[];
        }[]
    > {
        const result: QueryResult<{
            user_id: string;
            currency_id: string;
            transaction_ids: string[];
            amounts: string[];
            levels: number[];
            created_ats: Date[];
        }> = await this.runner.run(
            WalletRepository.GetChainedTransactionDetailQuery,
            filters.userId,
            filters.currencyIds,
            filters.userId,
            filters.currencyIds,
            filters.historySize,
        );
        return result.rows.map((row) => ({
            userId: row.user_id,
            currencyId: row.currency_id,
            transactionIds: row.transaction_ids,
            amounts: row.amounts,
            levels: row.levels,
            createdAts: row.created_ats,
        }));
    }

    private static TransactionQuery = `
        WITH in_data AS 
        (
            SELECT * 
            FROM  (VALUES (%L, %L, %L)) 
            AS t(user_id, currency_ids, amount_to_fund)
        ),
        currency_ids (
            SELECT 
                currency_id
            FROM 
                (SELECT UNNEST(currency_ids) currency_id FROM in_data) AS t
            UNION
                SELECT
                    ${Currencies.currency_id} currency_id
                FROM 
                    ${Currencies.$$NAME}
                WHERE 
                    (SELECT currency_ids FROM indata) IS NULL
        ),
        nullable_wallet AS (
            SELECT 
                ${Wallets.user_id} user_id, 
                ${Wallets.currency_id} currency_id,
                ${Wallets.head_transaction_id} head_transaction_od
            FROM 
                ${Wallets.$$NAME}
            WHERE 
                ${Wallets.user_id} = IN (SELECT user_id FROM in_data) AND
                ${Wallets.currency_id} = IN (SELECT currency_id FROM currency_ids)
        ),
        wallet AS (
            SELECT 
                *
            FROM 
                nullable_wallet
            UNION
            SELECT 
                (SELECT user_id FROM in_data) user_id,
                (SELECT currency_id FROM in_data) currency_id,
                NULL head_transaction_id
            WHERE 
                NOT EXISTS (nullable_wallet)
        ),
        nullable_last_transaction AS (
            SELECT 
                ${Transactions.transaction_id} transaction_id,
                ${Transactions.amount} amount
            FROM
                ${Transactions.$$NAME}
            WHERE 
                ${Transactions.transaction_id} = IN (SELECT head_transaction_id FROM wallet)
        ),
        last_transaction AS (
            SELECT 
                *
            FROM 
                nullable_last_transaction
            UNION
                SELECT
                    NULL transaction_id,
                    0 amount
                WHERE NOT EXISTS(nullable_last_transaction)
        ),
        new_transaction AS (
            INSERT INTO ${Transactions.$$NAME}
            (
                ${Transactions.amount},
                ${Transactions.prev_transaction_id}
            )
            SELECT 
                amount %s (SELECT amount_to_fund FROM in_data),
                transaction_id
            FROM 
                last_transaction
            RETURNING 
                ${Transactions.transaction_id} transaction_id,
                ${Transactions.amount} amount_available
        ),
        wallet_currency AS (
            SELECT 
                ${Currencies.currency_id} currency_id,
                ${Currencies.iso} iso
            FROM 
                ${Currencies.$$NAME} 
            WHERE 
                ${Currencies.currency_id} = IN (SELECT currency_id FROM currency_ids)
        )
        INSERT INTO ${Wallets.$$NAME}
        (
            ${Wallets.user_id},
            ${Wallets.currency_id},
            ${Wallets.head_transaction_id}
        )
        VALUES (
            SELECT 
                user_id,
                currency_id,
                (SELECT transaction_id FROM new_transaction)
            FROM
                in_data
        )
        ON CONFLICT (${Wallets.user_id}, ${Wallets.currency_id})
        DO UPDATE SET
            ${Wallets.head_transaction_id} = EXCLUDED.${Wallets.head_transaction_id}
        RETURNING 
            ${Wallets.head_transaction_id} head_transaction_id,
            (SELECT amount_available FROM new_transaction) amount_available,
            (SELECT amount_to_fund FROM in_data) amount_transacted,
            (SELECT iso FROM wallet_currency) currency_iso
    `;

    private static GetHeadTransactionQuery = `
        SELECT 
            w.${Wallets.head_transaction_id} transaction_id,
            w.${Wallets.currency_id} currency_id,
            t.${Transactions.amount} amount_available
        FROM
            ${Wallets.$$NAME} w
        LEFT JOIN
            ${Transactions.$$NAME} t
        ON
            w.${Wallets.head_transaction_id} = t.${Transactions.transaction_id}
        WHERE
            w.${Wallets.user_id} = %L AND
            w.${Wallets.currency_id} = %L
    `;

    private static GetChainedTransactionDetailQuery = `
        WITH in_data AS (
            SELECT *
            FROM (VALUES (%L, %L, %L))
            AS t(user_id, currency_ids, history_size)
        ),
        head_transaction AS (
            SELECT 
                ${Wallets.head_transaction_id} transaction_id,
                ${Wallets.currency_id} currency_id
                ${Wallets.user_id} user_id
            FROM
                ${Wallets.$$NAME}
            WHERE 
                ${Wallets.user_id} = %L AND
                ${Wallets.currency_id} IN (%L)
        )
        WITH RECURSIVE c AS (
            SELECT 
                ht.transaction_id transaction_id,
                ht.currency_id currency_id,
                ht.user_id user_id,
                ct.${Transactions.amount} amount_available,
                ct.${Transactions.prev_transaction_id} prev_transaction_id,
                ct.${Transactions.created_at} created_at
                0 level
            FROM
                head_transaction ht
            LEFT JOIN
                ${Transactions.$$NAME} ct
            ON
                ht.tranaction_id = ct.${Transactions.transaction_id}
       
            UNION

            SELECT 
                _self.${Transactions.transaction_id} transaction_id,
                _parent.currency_id currency_id
                _parent.user_id user_id
                _self.${Transactions.amount} amount,
                _self.${Transactions.prev_transaction_id} prev_transaction_id,
                _self.${Transactions.created_at} created_at,
                _parent.level+1 level
            FROM 
                ${Transactions.$$NAME} _self
            LEFT JOIN 
                c _parent
            ON 
                _parent.prev_transaction_id = _self.${Transactions.transaction_id}
            WHERE
                _parent.level < %L
        )

        SELECT 
            user_id,
            currency_id,
            ARRAY_AGG(transaction_id) transaction_ids,
            ARRAY_AGG(amount) amounts,
            ARRAY_AGG(level) levels,
            ARRAY_AGG(created_at) created_ats
        FROM 
            c
        GROUP BY 
            user_id,
            currency_id
    `;
}
