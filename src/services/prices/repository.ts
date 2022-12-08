import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { ParallelRates } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';

interface RawParallelRateModel {
    currency_id: TableDataType.ParallelRate['currency_id'];
    rate: TableDataType.ParallelRate['rate'];
    created_at: TableDataType.ParallelRate['created_at'];
    rates: TableDataType.ParallelRate['rate'][];
    created_ats: TableDataType.ParallelRate['created_at'][];
}

export interface ParallelRateModel {
    currencyId: RawParallelRateModel['currency_id'];
    rate: RawParallelRateModel['rate'];
    rates: RawParallelRateModel['rates'];
    createdAt: RawParallelRateModel['created_at'];
    createdAts: RawParallelRateModel['created_ats'];
}

export default class CurrenciesRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async save(inData: {
        parallelRateModels: Pick<ParallelRateModel, 'currencyId' | 'rate'>[];
    }): Promise<boolean> {
        const result = await this.runner.run(
            CurrenciesRepository.SetQuery,
            inData.parallelRateModels.map((model) => [model.currencyId, model.rate]),
        );

        return !!result.rowCount;
    }

    async obtain(inData: {
        filters: {
            intervalInSecs: number;
            currencyId?: string;
            rate?: number;
            createdAt?: number;
            currencyRateLength: number;
            offset: number;
            size: number;
        };
    }) {
        const result: QueryResult<Omit<RawParallelRateModel, 'rate' | 'created_at'>> =
            await this.runner.run(
                CurrenciesRepository.GetQuery,
                inData.filters.intervalInSecs,
                inData.filters.intervalInSecs,
                inData.filters.currencyId,
                inData.filters.currencyId,
                inData.filters.rate,
                inData.filters.rate,
                inData.filters.createdAt,
                inData.filters.createdAt,
                inData.filters.intervalInSecs,
                inData.filters.offset,
                inData.filters.size,
                inData.filters.currencyRateLength,
            );

        return result.rows.map((row): Omit<ParallelRateModel, 'rate' | 'createdAt'> => {
            return {
                currencyId: row.currency_id,
                rates: row.rates,
                createdAts: row.created_ats,
            };
        });
    }

    private static SetQuery = `
        INSERT INTO ${ParallelRates.$$NAME}
        (
            ${ParallelRates.currency_id},
            ${ParallelRates.rate},
            ${ParallelRates.created_at},
        ) 
        SELECT currency_id, rate, NOW()
        FROM (
            VALUES %L
        ) s(currency_id, rate)
    `;

    private static GetQuery = `
        WITH stage1 AS (
            SELECT DISTINCT ON ( 
                ${ParallelRates.currency_id},
                floor(EXTRACT(EPOCH FROM ${ParallelRates.created_at} ) / %L) 
            )
                ${ParallelRates.currency_id}, 
                LAST_VALUE(${ParallelRates.rate}) OVER w ${ParallelRates.rate}, 
                floor(EXTRACT(EPOCH FROM ${ParallelRates.created_at} ) / %L) ${ParallelRates.created_at},
                ROW_NUMBER() OVER w _row_no
            FROM 
                ${ParallelRates.$$NAME}
            WHERE 
                (
                    ${ParallelRates.currency_id} = %L OR
                    %L IS NULL
                ) AND
                (
                    ${ParallelRates.rate} >= %L OR
                    %L IS NULL
                ) AND 
                (
                    ${ParallelRates.rate} <= %L OR
                    %L IS NULL
                ) 
                (
                    ${ParallelRates.created_at} >= to_timestamp(%L)::TIMESTAMPTZ OR
                    %L IS NULL
                ) AND 
                (
                    ${ParallelRates.created_at} <= to_timestamp(%L)::TIMESTAMPTZ OR
                    %L IS NULL
                ) 
            WINDOW w AS (
                PARTITION BY 
                    ${ParallelRates.currency_id},
                    floor(EXTRACT(EPOCH FROM ${ParallelRates.created_at} ) / %L)
                ORDER BY 
                    ${ParallelRates.created_at} DESC
                )
        ),
        SELECT
            ${ParallelRates.currency_id} currency_id,
            ARRAY_AGG(${ParallelRates.rate}) rates,
            ARRAY_AGG(${ParallelRates.created_at}) created_ats
        FROM stage1
        WHERE 
            _row_no <= %L
        GROUP BY 
            ${ParallelRates.currency_id}
    `;
}
