import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { BlackRates } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';

interface RawBlackRateModel {
    user_id: TableDataType.BlackRate['user_id'];
    rate: TableDataType.BlackRate['rate'];
    rates: TableDataType.BlackRate['rate'][];
    base: TableDataType.BlackRate['base'];
    quota: TableDataType.BlackRate['quota'];
    created_at: TableDataType.BlackRate['created_at'];
    created_ats: TableDataType.BlackRate['created_at'][];
}

export interface BlackRateModel {
    userId: RawBlackRateModel['user_id'];
    rate: RawBlackRateModel['rate'];
    rates: RawBlackRateModel['rates'];
    base: RawBlackRateModel['base'];
    quota: RawBlackRateModel['quota'];
    createdAt: Date;
    createdAts: Date[];
}

export interface Filters {
    intervalInSecs: number;
    userIds?: string[];
    base?: string;
    quota?: string;
    minRate?: number;
    maxRate?: number;
    minCreatedAt?: number;
    maxCreatedAt?: number;
    limitPrePair: number;
    totalLimit: number;
}

export default class CurrenciesRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async openMarket(inData: {
        blackRateModel: Pick<BlackRateModel, 'userId' | 'base' | 'quota' | 'rate'>;
    }): Promise<boolean> {
        const result = await this.runner.run(
            CurrenciesRepository.OpenMarketQuery,
            inData.blackRateModel.userId,
            inData.blackRateModel.base,
            inData.blackRateModel.quota,
            inData.blackRateModel.rate,
        );

        return !!result.rowCount;
    }

    async closeMarket(inData: {
        blackRateModel: Pick<BlackRateModel, 'userId' | 'base' | 'quota'>;
    }): Promise<boolean> {
        const result = await this.runner.run(
            CurrenciesRepository.CloseMarketQuery,
            inData.blackRateModel.userId,
            inData.blackRateModel.base,
            inData.blackRateModel.quota,
        );
        return !!result.rowCount;
    }

    async getOverAllRates(inData: { filters: Filters }) {
        const result: QueryResult<
            Pick<RawBlackRateModel, 'base' | 'quota' | 'rates' | 'created_ats'>
        > = await this.runner.run(
            CurrenciesRepository.GetOverallQuery,
            ...this.getArgsForGetRunner(inData.filters),
        );

        console.log('getOverAllRates result rows', result.rows);

        return result.rows.map(
            (row): Pick<BlackRateModel, 'base' | 'quota' | 'rates' | 'createdAts'> => {
                return {
                    base: row.base,
                    quota: row.quota,
                    rates: row.rates,
                    createdAts: row.created_ats.map((createdAt) => new Date(createdAt)),
                };
            },
        );
    }

    async getSpecificRates(inData: { filters: Filters }) {
        const result: QueryResult<
            Pick<RawBlackRateModel, 'base' | 'quota' | 'rates' | 'created_ats' | 'user_id'>
        > = await this.runner.run(
            CurrenciesRepository.GetSpecificQuery,
            ...this.getArgsForGetRunner(inData.filters),
        );

        console.log('getOverAllRates result rows', result.rows);

        return result.rows.map(
            (row): Pick<BlackRateModel, 'userId' | 'base' | 'quota' | 'rates' | 'createdAts'> => {
                return {
                    userId: row.user_id,
                    base: row.base,
                    quota: row.quota,
                    rates: row.rates,
                    createdAts: row.created_ats.map((createdAt) => new Date(createdAt)),
                };
            },
        );
    }

    private getArgsForGetRunner(filters: Filters) {
        return [
            filters.intervalInSecs,
            filters.intervalInSecs,
            filters.userIds,
            filters.userIds,
            filters.base,
            filters.base,
            filters.quota,
            filters.quota,
            filters.minRate,
            filters.minRate,
            filters.maxRate,
            filters.maxRate,
            filters.minCreatedAt,
            filters.minCreatedAt,
            filters.maxCreatedAt,
            filters.maxCreatedAt,
            filters.intervalInSecs,
            filters.limitPrePair,
            filters.totalLimit,
        ];
    }

    private static OpenMarketQuery = `
        INSERT INTO ${BlackRates.$$NAME}
        (
            ${BlackRates.user_id},
            ${BlackRates.base},
            ${BlackRates.quota},
            ${BlackRates.rate},
            ${BlackRates.created_at}
        )
        VALUES 
        (
            %L,
            %L,
            %L,
            %L,
            NOW()
        )
    `;

    private static CloseMarketQuery = `
        INSERT INTO ${BlackRates.$$NAME}
        (
            ${BlackRates.user_id},
            ${BlackRates.base},
            ${BlackRates.quota},
            ${BlackRates.rate},
            ${BlackRates.created_at}
        )
        SELECT
            %L,
            %L,
            %L,
            NULL,
            NOW()
        FROM (
            SELECT 
                ${BlackRates.rate} rate
            FROM 
                ${BlackRates.$$NAME}
            WHERE 
                ${BlackRates.user_id} = %L AND
                ${BlackRates.base} = %L AND
                ${BlackRates.quota} = %L
            ORDER BY 
                ${BlackRates.created_at} DESC
            LIMIT 
                1
        ) prev_black_rate
        WHERE 
            prev_black_rate.rate IS NOT NULL
    `;

    private static GetOverallQuery = `
        WITH stage1 AS (
            SELECT DISTINCT ON ( 
                ${BlackRates.user_id},
                ${BlackRates.base},
                ${BlackRates.quota},
                floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / %L) ${BlackRates.created_at}
            )
                ${BlackRates.user_id},
                ${BlackRates.base},
                ${BlackRates.quota},
                LAST_VALUE(${BlackRates.rate}) OVER w ${BlackRates.rate}, 
                floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / %L) ${BlackRates.created_at},
            FROM 
                ${BlackRates.$$NAME}
            WHERE 
                (
                    ${BlackRates.user_id} IN (%L) OR
                    (%L) IS NULL
                ) AND
                (
                    ${BlackRates.base} = %L OR
                    %L IS NULL
                ) AND
                (
                    ${BlackRates.quota} = %L OR
                    %L IS NULL
                ) AND
                (
                    ${BlackRates.rate} >= %L OR
                    %L IS NULL
                ) AND 
                (
                    ${BlackRates.rate} <= %L OR
                    %L IS NULL
                ) 
                (
                    ${BlackRates.created_at} >= to_timestamp(%L)::TIMESTAMPTZ OR
                    %L IS NULL
                ) AND 
                (
                    ${BlackRates.created_at} <= to_timestamp(%L)::TIMESTAMPTZ OR
                    %L IS NULL
                ) 
            WINDOW w AS (
                PARTITION BY 
                    ${BlackRates.user_id},
                    ${BlackRates.base},
                    ${BlackRates.quota},
                    floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / %L) 
                ORDER BY 
                    ${BlackRates.created_at} DESC
                )
            ) 
        ),
        stage2 AS (
            SELECT
                ${BlackRates.base},
                ${BlackRates.quota},
                ${BlackRates.created_at},
                AVG(${BlackRates.rate}) ${BlackRates.rate}
                ROW_NUMBER() OVER w AS _row_no
            FROM 
                stage1
            GROUP BY 
                ${BlackRates.base},
                ${BlackRates.quota},
                ${BlackRates.created_at}
            WHERE
                ${BlackRates.rate} IS NOT NULL
            WINDOW w AS  (
                PARTITION BY 
                    ${BlackRates.base},
                    ${BlackRates.quota}
                ORDER BY 
                    ${BlackRates.created_at} DESC
            )
        ),
        SELECT
            ${BlackRates.base} base,
            ${BlackRates.quota} quota,
            ARRAY_AGG(${BlackRates.rate}) rates,
            ARRAY_AGG(${BlackRates.created_at}) created_ats
        FROM 
            stage2
        WHERE 
            row_no <= %L 
        GROUP BY 
            ${BlackRates.base},
            ${BlackRates.quota}
        LIMIT %L
    `;

    private static GetSpecificQuery = `
        WITH stage1 AS (
            SELECT DISTINCT ON ( 
                ${BlackRates.user_id},
                ${BlackRates.base},
                ${BlackRates.quota},
                floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / %L) ${BlackRates.created_at}
            )
                ${BlackRates.user_id},
                ${BlackRates.base},
                ${BlackRates.quota},
                LAST_VALUE(${BlackRates.rate}) OVER w ${BlackRates.rate}, 
                floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / %L) ${BlackRates.created_at},
            FROM 
                ${BlackRates.$$NAME}
            WHERE 
                (
                    ${BlackRates.user_id} IN (%L) OR
                    (%L) IS NULL
                ) AND
                (
                    ${BlackRates.base} = %L OR
                    %L IS NULL
                ) AND
                (
                    ${BlackRates.quota} = %L OR
                    %L IS NULL
                ) AND
                (
                    ${BlackRates.rate} >= %L OR
                    %L IS NULL
                ) AND 
                (
                    ${BlackRates.rate} <= %L OR
                    %L IS NULL
                ) 
                (
                    ${BlackRates.created_at} >= to_timestamp(%L)::TIMESTAMPTZ OR
                    %L IS NULL
                ) AND 
                (
                    ${BlackRates.created_at} <= to_timestamp(%L)::TIMESTAMPTZ OR
                    %L IS NULL
                ) 
            WINDOW w AS (
                PARTITION BY 
                    ${BlackRates.user_id},
                    ${BlackRates.base},
                    ${BlackRates.quota},
                    floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / %L) 
                ORDER BY 
                    ${BlackRates.created_at} DESC
                )
            ) 
        ),
        stage2 AS (
            SELECT
                ${BlackRates.user_id},
                ${BlackRates.base},
                ${BlackRates.quota},
                ${BlackRates.created_at},
                AVG(${BlackRates.rate}) ${BlackRates.rate}
                ROW_NUMBER() OVER w AS _row_no
            FROM 
                stage1
            WHERE
                ${BlackRates.rate} IS NOT NULL
            WINDOW w AS  (
                PARTITION BY 
                    ${BlackRates.user_id},
                    ${BlackRates.base},
                    ${BlackRates.quota}
                ORDER BY 
                    ${BlackRates.created_at} DESC
            )
        )
        SELECT
            ${BlackRates.user_id} user_id,
            ${BlackRates.base} base,
            ${BlackRates.quota} quota,
            ARRAY_AGG(${BlackRates.rate}) rates,
            ARRAY_AGG(${BlackRates.created_at}) created_ats
        FROM 
            stage2
        WHERE 
            row_no <= %L 
        GROUP BY 
            ${BlackRates.user_id},
            ${BlackRates.base},
            ${BlackRates.quota}
        LIMIT %L
    `;
}
