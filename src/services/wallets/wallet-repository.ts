import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import {
    HeadTransactions,
    Transactions,
    TransferTransactions,
} from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';

interface RawTransactionsModel {
    transaction_id: TableDataType.Transactions['transaction_id'];
    transaction_ids: TableDataType.Transactions['transaction_id'][];
    prev_transaction_id: TableDataType.Transactions['prev_transaction_id'];
    amount: TableDataType.Transactions['amount'];
    amounts: TableDataType.Transactions['amount'][];
    created_at: TableDataType.Transactions['created_at'];
    created_ats: TableDataType.Transactions['created_at'][];
    from_transaction_id: TableDataType.TransferTransactions['from_transaction_id'];
    to_transaction_id: TableDataType.TransferTransactions['to_transaction_id'];
    user_id: TableDataType.HeadTransactions['user_id'];
    currency_id: TableDataType.HeadTransactions['currency_id'];
    levels: number[];
}

export interface TransactionsModel {
    id: RawTransactionsModel['transaction_id'];
    ids: RawTransactionsModel['transaction_ids'];
    amount: RawTransactionsModel['amount'];
    amounts: RawTransactionsModel['amounts'];
    createdAt: RawTransactionsModel['created_at'];
    createdAts: RawTransactionsModel['created_ats'];
    userId: RawTransactionsModel['user_id'];
    currencyId: RawTransactionsModel['currency_id'];
    creditedBy: TableDataType.TransferTransactions['from_transaction_id'];
    debitedBy: TableDataType.TransferTransactions['to_transaction_id'];
    levels: number[];
}

export enum ErrorCode {
    FAILED_FUNDING,
    FAILED_WITHDRAWING,
    FAILED_CHAINED_DETAILS_RETRIEVAL,
    FAILED_HEAD_RETRIEVAL,
}

export class NullTransactionsModel implements TransactionsModel {
    constructor(private errorCode: ErrorCode) {}

    id = '';
    ids = [];
    amount = '';
    amounts = [];
    createdAt = '';
    createdAts = [];
    userId = '';
    currencyId = '';
    creditedBy = '';
    debitedBy = '';
    levels = [];

    getError(): ErrorCode {
        return this.errorCode;
    }
}

export interface TransactionData {
    userId: string;
    currencyId: string;
    amount: Amount;
}

type WholeNum = number;
type Decimal = number;
type Amount = [WholeNum, Decimal];

// TODO: Use PL/PGPSQL to obtain caching of query plans
export default class WalletRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async fund(inData: {
        transactionData: TransactionData;
    }): Promise<Pick<TransactionsModel, 'id'>> {
        const amountInNumericStr = this.convertAmountToNumericStr(inData.transactionData.amount);

        const result: QueryResult<Pick<RawTransactionsModel, 'transaction_id'>> =
            await this.runner.run(
                WalletRepository.FundQuery,
                inData.transactionData.userId,
                inData.transactionData.currencyId,
                amountInNumericStr,
                amountInNumericStr,
            );

        const row = result.rows[0];
        return row == null
            ? new NullTransactionsModel(ErrorCode.FAILED_FUNDING)
            : { id: row.transaction_id };
    }

    async withdraw(inData: {
        transactionData: TransactionData;
    }): Promise<Pick<TransactionsModel, 'id'>> {
        const amountInNumericStr = this.convertAmountToNumericStr(inData.transactionData.amount);

        const result: QueryResult<Pick<RawTransactionsModel, 'transaction_id'>> =
            await this.runner.run(
                WalletRepository.WithdrawQuery,
                inData.transactionData.userId,
                inData.transactionData.currencyId,
                amountInNumericStr,
                amountInNumericStr,
            );

        const row = result.rows[0];
        return row == null
            ? new NullTransactionsModel(ErrorCode.FAILED_WITHDRAWING)
            : { id: row.transaction_id };
    }

    // TODO: Obtain the no of inserts of whether done
    async saveCreditedBy(
        transactionModel: Pick<TransactionsModel, 'id' | 'creditedBy'>,
    ): Promise<boolean> {
        const result = await this.runner.run(
            WalletRepository.SetTransactionWithQuery,
            transactionModel.creditedBy,
            transactionModel.id,
        );

        return !!result.rowCount;
    }

    async saveDebitedBy(
        transactionModel: Pick<TransactionsModel, 'id' | 'debitedBy'>,
    ): Promise<boolean> {
        const result = await this.runner.run(
            WalletRepository.SetTransactionWithQuery,
            transactionModel.id,
            transactionModel.debitedBy,
        );

        return !!result.rowCount;
    }

    // TODO: A runner method for row == null ? null : mapper(row[0])
    async obtainHead(
        transactionModel: Pick<TransactionsModel, 'userId' | 'currencyId'>,
    ): Promise<Pick<TransactionsModel, 'id'>> {
        const result: QueryResult<Pick<RawTransactionsModel, 'transaction_id'>> =
            await this.runner.run(
                WalletRepository.GetHeadTransactionQuery,
                transactionModel.userId,
                transactionModel.currencyId,
            );

        const row = result.rows[0];
        return row == null
            ? new NullTransactionsModel(ErrorCode.FAILED_HEAD_RETRIEVAL)
            : { id: row.transaction_id };
    }

    async setHead(transactionModel: Pick<TransactionsModel, 'userId' | 'currencyId' | 'id'>) {
        const result = await this.runner.run(
            WalletRepository.SetHeadTransactionQuery,
            transactionModel.userId,
            transactionModel.currencyId,
            transactionModel.id,
        );

        return !!result.rowCount;
    }

    async getChainedDetails(filters: {
        userId: string;
        currencyIds: string[];
        historySize: number;
    }): Promise<
        Pick<
            TransactionsModel,
            'userId' | 'currencyId' | 'ids' | 'amounts' | 'levels' | 'createdAts'
        >
    > {
        const result: QueryResult<
            Pick<
                RawTransactionsModel,
                'user_id' | 'currency_id' | 'transaction_ids' | 'amounts' | 'levels' | 'created_ats'
            >
        > = await this.runner.run(
            WalletRepository.GetChainedTransactionDetailQuery,
            filters.userId,
            filters.currencyIds,
            filters.userId,
            filters.currencyIds,
            filters.historySize,
        );
        const row = result.rows[0];
        return row == null
            ? new NullTransactionsModel(ErrorCode.FAILED_CHAINED_DETAILS_RETRIEVAL)
            : {
                  userId: row.user_id,
                  currencyId: row.currency_id,
                  ids: row.transaction_ids,
                  amounts: row.amounts,
                  levels: row.levels,
                  createdAts: row.created_ats,
              };
    }

    private convertAmountToNumericStr([wholeNum, decimal]: Amount) {
        return `${wholeNum}.${decimal}`;
    }

    private static FundQuery = `
        WITH prev AS (
            SELECT 
                transaction.${Transactions.transaction_id} id,
                transaction.${Transactions.amount} amount,
                head_transaction.${HeadTransactions.user_id} user_id,
                head_transaction.${HeadTransactions.currency_id} currency_id
            FROM 
                ${HeadTransactions.$$NAME} head_transaction
            LEFT JOIN 
                ${Transactions.$$NAME} transaction
            ON 
                head_transaction.${HeadTransactions.transaction_id} = transaction.${Transactions.transaction_id}
            WHERE 
                head_transaction.${HeadTransactions.user_id} = %L AND
                head_transaction.${HeadTransactions.currency_id} = %L
        )

        INSERT INTO ${Transactions.$$NAME}
        (
            ${Transactions.prev_transaction_id},
            ${Transactions.amount},
            ${Transactions.created_at},
        )
        SELECT 
            id, amount + (%L)::NUMERIC, NOW()
        FROM 
            prev
        UNION 
        SELECT 
            NULL, (%L)::NUMERIC, NOW()
        WHERE 
            NOT EXISTS (prev)
        RETURNING ${Transactions.transaction_id} id
    `;

    private static WithdrawQuery = `
        WITH prev AS (
            SELECT 
                transaction.${Transactions.transaction_id} id,
                transaction.${Transactions.amount} amount,
                head_transaction.${HeadTransactions.user_id} user_id,
                head_transaction.${HeadTransactions.currency_id} currency_id
            FROM 
                ${HeadTransactions.$$NAME} head_transaction
            LEFT JOIN 
                ${Transactions.$$NAME} transaction
            ON 
                head_transaction.${HeadTransactions.transaction_id} = transaction.${Transactions.transaction_id}
            WHERE 
                head_transaction.${HeadTransactions.user_id} = %L AND
                head_transaction.${HeadTransactions.currency_id} = %L
        )

        INSERT INTO ${Transactions.$$NAME}
        (
            ${Transactions.prev_transaction_id},
            ${Transactions.amount},
            ${Transactions.created_at},
        )
        SELECT 
            id, amount - (%L)::NUMERIC, NOW()
        FROM 
            prev
        UNION 
        SELECT 
            NULL, -(%L)::NUMERIC, NOW()
        WHERE 
            NOT EXISTS (prev)
        RETURNING ${Transactions.transaction_id} id
    `;

    // TODO: Check if WITH INSERT combined with the two above will be more performant (or rather using PLPGSQL)
    private static SetTransactionWithQuery = `
        INSERT INTO ${TransferTransactions.$$NAME}
        (
            ${TransferTransactions.from_transaction_id},
            ${TransferTransactions.to_transaction_id}
        )
        VALUES (
            %L,
            %L
        )
    `;

    private static GetHeadTransactionQuery = `
        SELECT 
            ${HeadTransactions.transaction_id} transaction_id,
            ${HeadTransactions.currency_id} currency_id
        FROM
            ${HeadTransactions.$$NAME}
        WHERE
            ${HeadTransactions.user_id} = %L AND
            ${HeadTransactions.currency_id} = %L
    `;

    private static SetHeadTransactionQuery = `
        INSERT INTO ${HeadTransactions.$$NAME}
        (
            ${HeadTransactions.user_id},
            ${HeadTransactions.currency_id},
            ${HeadTransactions.transaction_id},
        )
        VALUES (
            %L,
            %L
            %L
        )
        ON CONFLICT (
            ${HeadTransactions.user_id},
            ${HeadTransactions.currency_id}
        )
        DO UPDATE
        SET
            ${HeadTransactions.transaction_id} = EXCLUDED.${HeadTransactions.transaction_id}
    `;

    private static GetChainedTransactionDetailQuery = `
        WITH _head AS (
            SELECT 
                ${HeadTransactions.transaction_id} transaction_id,
                ${HeadTransactions.currency_id} currency_id
                ${HeadTransactions.user_id} user_id
            FROM
                ${HeadTransactions.$$NAME}
            WHERE 
                ${HeadTransactions.user_id} = %L AND
                ${HeadTransactions.currency_id} IN (%L)
        )
        WITH RECURSIVE c AS (
            SELECT 
                _head.${HeadTransactions.transaction_id} transaction_id,
                _head.${HeadTransactions.currency_id} currency_id
                _head.${HeadTransactions.user_id} user_id,
                _transaction.${Transactions.amount} amount,
                _transaction.${Transactions.prev_transaction_id} prev_transaction_id,
                _transaction.${Transactions.created_at} created_at
                0 level
            FROM
                ${HeadTransactions.$$NAME} _head
            INNER JOIN
                ${Transactions.$$NAME} _transaction
            ON
                _head.${HeadTransactions.transaction_id} = _transaction.${Transactions.transaction_id}
            WHERE 
                _head.${HeadTransactions.user_id} = %L AND
                _head.${HeadTransactions.currency_id} IN (%L)
            
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
