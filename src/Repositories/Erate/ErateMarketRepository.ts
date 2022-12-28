import { QueryResult } from 'pg';
import { Runner } from '../../Application/Common/Interfaces/Database/Runner';
import {
    BankRateAlerts,
    BlackRates,
    Currencies,
    Notifications,
    OfficialRateAlerts,
    ParallelRates,
    RateAlerts,
    Users,
    Wallets,
} from '../../Database/Erate/Tables';
import * as TableDataType from '../../Database/Erate/TableDataTypes';
import _ from 'lodash';
import BlackRate from '../../Application/Common/Interfaces/Entities/BlackRate';

interface RawBlackRateModel {
    black_rate_id: TableDataType.BlackRate['black_rates_id'];
    bank_rate_id: TableDataType.BlackRate['black_rates_id'];
    user_id: TableDataType.BlackRate['user_id'];
    user_name: string;
    rate: TableDataType.BlackRate['rate'];
    rates: TableDataType.BlackRate['rate'][];
    base: TableDataType.BlackRate['base'];
    quota: TableDataType.BlackRate['quota'];
    created_at: TableDataType.BlackRate['created_at'];
    created_ats: TableDataType.BlackRate['created_at'][];
}

export interface Filters {
    intervalInSecs: number;
    userIds?: string[];
    bankRateIds?: string[];
    baseIds?: number[];
    quotaIds?: number[];
    minRate?: string;
    maxRate?: string;
    minCreatedAt?: Date;
    maxCreatedAt?: Date;
    totalLimit: number;
    historyMaxSize: number;
}

export default class MarketRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async getOfficialMarketRate(inData: {
        base: string;
        quota?: string[];
        intervalInSecs: number;
        minCreatedAt?: Date;
        maxCreatedAt: Date;
        historyLength: number;
    }): Promise<
        {
            currencyId: number;
            rates: string[];
            createdAts: Date[];
            rowNos: number[];
        }[]
    > {
        const result: QueryResult<{
            currency_id: number;
            rates: string[];
            created_ats: Date[];
            row_nos: number[];
        }> = await this.runner.run(
            MarketRepository.GetParallelMarketQuery,
            inData.base,
            inData.quota,
            inData.intervalInSecs,
            inData.minCreatedAt,
            inData.maxCreatedAt,
            inData.historyLength,
        );

        return result.rows.map((row) => ({
            currencyId: row.currency_id,
            rates: row.rates,
            createdAts: row.created_ats,
            rowNos: row.row_nos,
        }));
    }

    async updateParallelMarket(inData: {
        newRates: { currencyId: number; rate: string; createdAt: Date }[];
    }) {
        await this.runner.run(
            MarketRepository.UpdateParallelMarketQuery,
            inData.newRates.map((rate) => [rate.currencyId, rate.rate, rate.createdAt]),
        );
    }

    async updateParallelMarketWithSelfGeneratedData() {
        await this.runner.run(MarketRepository.UpdateParallelMarketWithSelfGeneratedDataQuery);
    }

    async hasAllCurrenciesRate() {
        const result: QueryResult<{ has_all_currencies_rate: boolean }> = await this.runner.run(
            MarketRepository.HasAllCurrenciesRateQuery,
        );

        return result.rows[0].has_all_currencies_rate;
    }

    async openBlackMarket(inData: {
        blackRate: {
            userId: string;
            baseCurrencyId: number;
            quotaCurrencyId: number;
            rate: string;
        };
    }): Promise<{ bankRateId: string }> {
        const result: QueryResult<Pick<RawBlackRateModel, 'black_rate_id'>> = await this.runner.run(
            MarketRepository.openBlackMarketQuery,
            inData.blackRate.userId,
            inData.blackRate.baseCurrencyId,
            inData.blackRate.quotaCurrencyId,
            inData.blackRate.rate,
        );

        return { bankRateId: result.rows[0].black_rate_id };
    }

    async closeBlackMarket(inData: {
        blackRate: { userId: string; baseCurrencyId: number; quotaCurrencyId: number };
    }): Promise<{ bankRateId: string }> {
        const result: QueryResult<Pick<RawBlackRateModel, 'black_rate_id'>> = await this.runner.run(
            MarketRepository.closeBlackMarketQuery,
            inData.blackRate.userId,
            inData.blackRate.baseCurrencyId,
            inData.blackRate.quotaCurrencyId,
        );
        return { bankRateId: result.rows[0].black_rate_id };
    }

    // async getOverAllBlackRates(inData: {
    //     filters: Omit<Filters, 'userId'> & Required<{ userIds: Filters['userIds'] }>;
    // }) {
    //     const result: QueryResult<
    //         Pick<RawBlackRateModel, 'base' | 'quota' | 'created_ats' | 'rates'>
    //     > = await this.runner.run(
    //         MarketRepository.GetOverallQuery,
    //         ...this.getArgsForGetRunner(inData.filters),
    //     );

    //     return result.rows.map(
    //         (row): Pick<BlackRate, 'base' | 'quota' | 'rates' | 'createdAts'> => {
    //             return {
    //                 base: row.base,
    //                 quota: row.quota,
    //                 rates: row.rates,
    //                 createdAts: row.created_ats.map((createdAt) => new Date(createdAt)),
    //             };
    //         },
    //     );
    // }

    async getSpecificBlackRates(inData: { filters: Filters }) {
        console.log('inData.filters', inData.filters);
        const result: QueryResult<
            Pick<
                RawBlackRateModel,
                | 'bank_rate_id'
                | 'user_id'
                | 'user_name'
                | 'base'
                | 'quota'
                | 'rates'
                | 'created_ats'
            > & { row_nos: number[] }
        > = await this.runner.run(
            MarketRepository.GetSpecificQuery,
            inData.filters.bankRateIds,
            inData.filters.baseIds,
            inData.filters.quotaIds,
            inData.filters.intervalInSecs,
            inData.filters.userIds,
            inData.filters.minRate,
            inData.filters.maxRate,
            inData.filters.minCreatedAt,
            inData.filters.maxCreatedAt,
            inData.filters.historyMaxSize,
            inData.filters.totalLimit,
        );

        console.log('getSpecificBlackRates repo', result.rows);

        return result.rows.map((row) => {
            return {
                bankRateId: row.bank_rate_id,
                userId: row.user_id,
                bankName: row.user_name,
                baseId: +row.base,
                quotaId: +row.quota,
                rates: row.rates,
                createdAts: row.created_ats.map((createdAt) => new Date(createdAt)),
                rowNos: row.row_nos,
            };
        });
    }

    private static UpdateParallelMarketQuery = `
        WITH new_rates AS (
            INSERT INTO ${ParallelRates.$$NAME}
            (
                ${ParallelRates.currency_id},
                ${ParallelRates.rate},
                ${ParallelRates.created_at}
            )
            VALUES %L
            RETURNING 
                ${ParallelRates.currency_id} currency_id,
                ${ParallelRates.rate} rate
        ),
        triggering_alerts AS (
            SELECT 
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                pairs.curr_rate >= pairs.set_rate is_up
            FROM 
                ${OfficialRateAlerts.$$NAME} official
            LEFT JOIN
                ${RateAlerts.$$NAME} pa
            ON 
                pa.${RateAlerts.rate_alerts_id} = official.${OfficialRateAlerts.rate_alerts_id}
            LEFT JOIN LATERAL (
                SELECT 
                    p.${ParallelRates.rate} set_rate,
                    nr.rate curr_rate
                FROM 
                    ${ParallelRates.$$NAME} p
                LEFT JOIN
                    new_rates nr
                ON 
                    nr.currency_id = p.${ParallelRates.currency_id}
                WHERE 
                    p.${ParallelRates.currency_id} = pa.${RateAlerts.base} AND
                    p.${ParallelRates.created_at} <= pa.${RateAlerts.created_at}
                ORDER BY
                    p.${ParallelRates.created_at} DESC
                LIMIT 
                    1
            ) base_currency
            ON TRUE
            
            LEFT JOIN LATERAL (
                SELECT 
                    p.${ParallelRates.rate} set_rate,
                    nr.rate curr_rate
                FROM 
                    ${ParallelRates.$$NAME} p
                LEFT JOIN
                    new_rates nr
                on 
                    nr.currency_id = p.${ParallelRates.currency_id}
                WHERE 
                    p.${ParallelRates.currency_id} = pa.${RateAlerts.quota} AND
                    p.${ParallelRates.created_at} <= pa.${RateAlerts.created_at}
                ORDER BY
                    p.${ParallelRates.created_at} DESC
                LIMIT 
                    1
            )  quota_currency
            ON TRUE

            LEFT JOIN LATERAL (
                SELECT 
                    quota_currency.set_rate/(base_currency.set_rate) set_rate,
                    (quota_currency.curr_rate)/(base_currency.curr_rate) curr_rate
            ) pairs
            ON TRUE
            WHERE
                ((
                    pa.${RateAlerts.target_rate} >= pairs.set_rate AND
                    pa.${RateAlerts.target_rate} <= pairs.curr_rate 
                ) OR
                (
                    pa.${RateAlerts.target_rate} <= pairs.set_rate AND
                    pa.${RateAlerts.target_rate} >= pairs.curr_rate 
                )) AND pa.${RateAlerts.triggered_at} IS NULL 
        ),

        triggered_alerts AS (
            UPDATE ${RateAlerts.$$NAME} pa
            SET
                ${RateAlerts.triggered_at} = NOW()
            FROM 
                triggering_alerts ta
            LEFT JOIN 
                ${OfficialRateAlerts.$$NAME} official
            ON
                ta.${RateAlerts.rate_alerts_id} = official.${OfficialRateAlerts.rate_alerts_id}
            WHERE
                pa.${RateAlerts.rate_alerts_id} = ta.rate_alerts_id
            RETURNING 
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                official.${OfficialRateAlerts.user_id} user_id,
                pa.${RateAlerts.base} base_currency_id,
                pa.${RateAlerts.quota} quota_currency_id,
                pa.${RateAlerts.target_rate} target_rate,
                ta.is_up is_up
        ),
        pending_notification_details AS (
            SELECT
                ta.user_id user_id,
                base_currency.${Currencies.iso} base_currency_abbrev,
                quota_currency.${Currencies.iso} quota_currency_abbrev,
                ta.is_up is_up,
                ta.target_rate target_rate
            FROM 
                triggered_alerts ta
            LEFT JOIN
                ${Currencies.$$NAME} base_currency
            ON
                ta.base_currency_id = base_currency.${Currencies.currency_id}
            LEFT JOIN
                ${Currencies.$$NAME} quota_currency
            ON
                ta.quota_currency_id = quota_currency.${Currencies.currency_id}
        )

        INSERT INTO ${Notifications.$$NAME}
        (
            ${Notifications.user_id},
            ${Notifications.type},
            ${Notifications.msg}
        )
        SELECT
            user_id,
            'P',
            base_currency_abbrev || '/' || quota_currency_abbrev || ' has reached ' || target_rate 
        FROM 
            pending_notification_details pnd
       
    `;

    private static openBlackMarketQuery = `
        WITH new_rates AS (
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
            RETURNING 
                ${BlackRates.black_rates_id} black_rate_id,
                ${BlackRates.user_id} user_id,
                ${BlackRates.base} base,
                ${BlackRates.quota} quota,
                ${BlackRates.rate} rate,
                ${BlackRates.created_at} created_at
        ),
        triggering_alerts AS (
            SELECT 
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                nr.user_id user_id,
                nr.rate >= sr.rate is_up
            FROM 
                ${RateAlerts.$$NAME} pa
            INNER JOIN 
                ${BankRateAlerts.$$NAME} br
            ON
                br.${BankRateAlerts.rate_alerts_id} = pa.${BankRateAlerts.rate_alerts_id}
            INNER JOIN 
                new_rates nr
            ON 
                nr.base = pa.${RateAlerts.base} AND
                nr.quota = pa.${RateAlerts.quota} AND
                nr.user_id = br.${BankRateAlerts.bank_user_id}
            INNER JOIN LATERAL (
                SELECT 
                    b.${BlackRates.rate} rate
                FROM 
                    ${BlackRates.$$NAME} b
                WHERE 
                nr.base = b.${BlackRates.base} AND
                nr.quota = b.${BlackRates.quota} AND
                nr.user_id = b.${BlackRates.user_id} AND
                b.${BlackRates.created_at} <= pa.${RateAlerts.created_at} 
                ORDER BY
                    b.${BlackRates.created_at} DESC
                LIMIT 
                    1
            ) sr
            ON TRUE
            WHERE
                ((
                    pa.${RateAlerts.target_rate} <= nr.rate AND
                    pa.${RateAlerts.target_rate} >= sr.rate 
                ) OR
                (
                    pa.${RateAlerts.target_rate} >= nr.rate  AND
                    pa.${RateAlerts.target_rate} <= sr.rate 
                )) AND  pa.${RateAlerts.triggered_at} IS NULL
        ),

        triggered_alerts AS (
            UPDATE ${RateAlerts.$$NAME} pa
            SET
                ${RateAlerts.triggered_at} = NOW()
            WHERE 
                pa.${RateAlerts.rate_alerts_id}  IN (SELECT rate_alerts_id FROM triggering_alerts)
            RETURNING 
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                (SELECT user_id FROM triggering_alerts) user_id,
                pa.${RateAlerts.base} base_currency_id,
                pa.${RateAlerts.quota} quota_currency_id,
                pa.${RateAlerts.target_rate} target_rate,
                (SELECT is_up FROM triggering_alerts) is_up
        ),
        pending_notification_details AS (
            SELECT
                ta.user_id user_id,
                base_currency.${Currencies.iso} base_currency_abbrev,
                quota_currency.${Currencies.iso} quota_currency_abbrev,
                ta.is_up is_up,
                ta.target_rate target_rate
            FROM 
                triggered_alerts ta
            LEFT JOIN
                ${Currencies.$$NAME} base_currency
            ON
                ta.base_currency_id = base_currency.${Currencies.currency_id}
            LEFT JOIN
                ${Currencies.$$NAME} quota_currency
            ON
                ta.quota_currency_id = quota_currency.${Currencies.currency_id}
        )

        INSERT INTO ${Notifications.$$NAME}
        (
            ${Notifications.user_id},
            ${Notifications.type},
            ${Notifications.msg}
        )
        SELECT
            user_id,
            'P',
            base_currency_abbrev || '/' || quota_currency_abbrev || ' has reached ' || target_rate 
        FROM 
            pending_notification_details pnd
    `;

    private static closeBlackMarketQuery = `
        INSERT INTO ${BlackRates.$$NAME}
        (
            ${BlackRates.user_id},
            ${BlackRates.base},
            ${BlackRates.quota},
            ${BlackRates.rate},
            ${BlackRates.created_at}
        )
        SELECT
            user_id,
            base,
            quota,
            NULL,
            NOW()
        FROM (
            SELECT 
                ${BlackRates.user_id} user_id,
                ${BlackRates.base} base,
                ${BlackRates.quota} quota,
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
        RETURNING ${BlackRates.black_rates_id} black_rate_id
    `;

    // TODO: Check out again
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
                ${BlackRates.quota},  R
                FIRST_VALUE(${BlackRates.rate}) OVER w ${BlackRates.rate}, 
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
                    ${BlackRates.quota} IN (%L) OR
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
                ${BlackRates.base} base,
                ${BlackRates.quota} quota,
                ${BlackRates.created_at} created_at,
                AVG(${BlackRates.rate}) OVER w rate
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
                    ${BlackRates.quota},
                    ${BlackRates.created_at}
            )
        ),
        SELECT
            base,
            quota,
            ARRAY_AGG(rate) rates,
            ARRAY_AGG(created_at) created_ats
        FROM 
            stage2
        GROUP BY 
            base,
            quota
        LIMIT %L
    `;

    private static GetSpecificQuery = `
        WITH in_data AS (
            SELECT * FROM 
            (
                VALUES (
                    (%L)::TEXT,
                    (%L)::INTEGER, 
                    (%L)::INTEGER, 
                    (%L)::BIGINT, 
                    (%L)::TEXT, 
                    (%L)::NUMERIC, 
                    (%L)::NUMERIC, 
                    (%L)::TIMESTAMPTZ, 
                    (%L)::TIMESTAMPTZ,
                    (%L)::INTEGER, 
                    (%L)::INTEGER
                )
            )
            AS t(
                rate_ids, 
                base_ids, quota_ids, interval, user_ids, min_rate, max_rate, min_created_at, max_created_at,history_length, max_total_size)
            
        ),
        stage1 AS (
            SELECT DISTINCT ON ( 
                ${BlackRates.user_id},
                ${BlackRates.base},
                ${BlackRates.quota},
                floor(
                    EXTRACT(EPOCH FROM ${BlackRates.created_at} ) /
                    (SELECT interval FROM in_data)
                ) 
            )
                ${BlackRates.black_rates_id} bank_rate_id,
                ${BlackRates.user_id} user_id,
                ${BlackRates.base} base,
                ${BlackRates.quota} quota,
                FIRST_VALUE(${BlackRates.rate}) OVER w1 rate, 
                floor(
                    EXTRACT(EPOCH FROM ${BlackRates.created_at} ) /
                    (SELECT interval FROM in_data)
                )  created_at,
                ROW_NUMBER() OVER w2 row_no
            FROM 
                ${BlackRates.$$NAME}
            WHERE 
                (
                    ${BlackRates.black_rates_id}::TEXT IN (SELECT rate_ids FROM in_data) OR
                    (SELECT rate_ids FROM in_data) IS NULL
                ) AND
                (
                    ${BlackRates.user_id}::text IN (SELECT user_ids FROM in_data) OR
                    (SELECT user_ids FROM in_data) IS NULL
                ) AND
                (
                    ${BlackRates.base} = (SELECT base_ids FROM in_data) OR
                    (SELECT base_ids FROM in_data) IS NULL
                ) AND
                (
                    ${BlackRates.quota} = (SELECT quota_ids FROM in_data) OR
                    (SELECT quota_ids FROM in_data) IS NULL
                ) AND
                (
                    ${BlackRates.rate} >= (SELECT min_rate FROM in_data) OR
                    (SELECT min_rate FROM in_data) IS NULL
                ) AND 
                (
                    ${BlackRates.rate} <= (SELECT max_rate FROM in_data) OR
                    (SELECT max_rate FROM in_data) IS NULL
                ) AND
                (
                    ${BlackRates.created_at} >= (SELECT min_created_at FROM in_data) OR
                    (SELECT min_created_at FROM in_data)  IS NULL
                ) AND 
                (
                    ${BlackRates.created_at} <= (SELECT max_created_at FROM in_data) OR
                    (SELECT max_created_at FROM in_data)  IS NULL
                ) 
            WINDOW w1 AS (
                PARTITION BY 
                    ${BlackRates.user_id},
                    ${BlackRates.base},
                    ${BlackRates.quota},
                    floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / (SELECT interval FROM in_data)) 
                ORDER BY 
                    ${BlackRates.created_at} DESC
            ),
            w2 AS (
                PARTITION BY 
                    ${BlackRates.user_id},
                    ${BlackRates.base},
                    ${BlackRates.quota}
                ORDER BY 
                    floor(EXTRACT(EPOCH FROM ${BlackRates.created_at} ) / (SELECT interval FROM in_data))  DESC
            ) 
        ),
        stage2 AS (
            SELECT
                u.user_id,
                u.name user_name,
                s.base,
                s.quota,
                ARRAY_AGG(s.bank_rate_id) bank_rate_id,
                ARRAY_AGG(s.rate) rates,
                ARRAY_AGG(s.row_no) row_nos,
                ARRAY_AGG(s.created_at) created_ats
            FROM 
                stage1 s
            LEFT JOIN 
                ${Users.$$NAME} u
            ON 
                u.${Users.user_id} = s.user_id
            WHERE 
                s.rate IS NOT NULL AND
                s.row_no <= (SELECT history_length FROM in_data)
            GROUP BY 
                u.user_id,
                s.base,
                s.quota
            LIMIT (SELECT max_total_size FROM in_data)
        )
        SELECT * FROM stage2
    `;

    // TODO: Remove clue of the server timezone using AT TIMEZONE 'UTC'
    private static GetParallelMarketQuery = `
        WITH in_data AS (
            SELECT * FROM (VALUES ((%L)::INTEGER, (%L)::INTEGER[], (%L)::BIGINT, (%L)::TIMESTAMPTZ, (%L)::TIMESTAMPTZ, (%L)::INTEGER))
            AS t(base, quotas, interval, min_created_at, max_created_at, history_length)
        ),
        stage1 AS (
            SELECT DISTINCT ON ( 
                ${ParallelRates.currency_id},
                floor(
                    EXTRACT(EPOCH FROM ${ParallelRates.created_at} ) / 
                    (SELECT interval FROM in_data)
                )
            )
                ${ParallelRates.currency_id} currency_id,
                FIRST_VALUE(${ParallelRates.rate}) OVER w1  rate, 
                to_timestamp(
                    (SELECT interval FROM in_data) * 
                    floor(
                        EXTRACT(EPOCH FROM ${ParallelRates.created_at} ) / 
                        (SELECT interval FROM in_data)
                    )
                )::TIMESTAMPTZ created_at,
                ROW_NUMBER() OVER w2 row_no
            FROM 
                ${ParallelRates.$$NAME}
            WHERE 
                (
                    ${ParallelRates.currency_id} = (SELECT base FROM in_data)
                ) OR 
                (
                    (SELECT quotas FROM in_data) IS NULL OR
                    ${ParallelRates.currency_id} IN (SELECT UNNEST(quotas) FROM in_data)
                ) OR
                (
                    ${ParallelRates.created_at} >= (SELECT min_created_at FROM in_data) OR
                    (SELECT min_created_at FROM in_data) IS NULL
                ) AND 
                (
                    ${ParallelRates.created_at} <= (SELECT max_created_at FROM in_data) OR
                    (SELECT max_created_at FROM in_data) IS NULL
                ) 
            WINDOW w1 AS (
                PARTITION BY 
                    ${ParallelRates.currency_id},
                    floor(
                        EXTRACT(EPOCH FROM ${ParallelRates.created_at} ) / (SELECT interval FROM in_data)
                    )
                ORDER BY 
                    ${ParallelRates.created_at} DESC
            ),
            w2 AS (
				PARTITION BY 
                    ${ParallelRates.currency_id}
                  ORDER BY floor(
                        EXTRACT(EPOCH FROM ${ParallelRates.created_at} ) / (SELECT interval FROM in_data)
                   ) DESC
            )
        ),
        stage2 AS (
            SELECT * 
            FROM stage1
            WHERE 
                currency_id = (SELECT base FROM in_data)
        ),
        stage3 AS (
            SELECT
                quota.currency_id,
                ARRAY_AGG(ROUND(quota.rate/base.rate, 6)) rates,
                ARRAY_AGG(quota.created_at) created_ats,
                ARRAY_AGG(quota.row_no) row_nos
            FROM 
                stage1 quota
            LEFT JOIN 
                stage2 base
            ON 
                quota.created_at = base.created_at
                WHERE
                (
                    (SELECT history_length FROM in_data) IS NULL OR
                    (SELECT history_length FROM in_data) >= quota.row_no
                    )
            GROUP BY 
                quota.currency_id    
        )
        SELECT * FROM stage3
    `;

    // TODO: Use time as a determinant for generating new rate
    static UpdateParallelMarketWithSelfGeneratedDataQuery = `
        WITH new_rates AS (
        INSERT INTO
            ${ParallelRates.$$NAME}
            (${ParallelRates.currency_id}, ${ParallelRates.rate})

        SELECT DISTINCT ON (${ParallelRates.currency_id})
            ${ParallelRates.currency_id}, 
            COALESCE((FIRST_VALUE(${ParallelRates.rate}) OVER w), 1) + COALESCE((FIRST_VALUE(${ParallelRates.rate}) OVER w), 0) * (RANDOM() - 0.5) * 0.0095

        FROM 
            ${ParallelRates.$$NAME}
            
        WINDOW 
            w AS (PARTITION BY ${ParallelRates.currency_id} ORDER BY ${ParallelRates.created_at} DESC) 

        RETURNING 
            ${ParallelRates.currency_id} currency_id,
            ${ParallelRates.rate} rate
        ),
        triggering_alerts AS (
            SELECT 
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                pairs.curr_rate >= pairs.set_rate is_up
            FROM 
                ${OfficialRateAlerts.$$NAME} official
            LEFT JOIN
                ${RateAlerts.$$NAME} pa
            ON 
                pa.${RateAlerts.rate_alerts_id} = official.${OfficialRateAlerts.rate_alerts_id}
            LEFT JOIN LATERAL (
                SELECT 
                    p.${ParallelRates.rate} set_rate,
                    nr.rate curr_rate
                FROM 
                    ${ParallelRates.$$NAME} p
                LEFT JOIN
                    new_rates nr
                ON 
                    nr.currency_id = p.${ParallelRates.currency_id}
                WHERE 
                    p.${ParallelRates.currency_id} = pa.${RateAlerts.base} AND
                    p.${ParallelRates.created_at} <= pa.${RateAlerts.created_at}
                ORDER BY
                    p.${ParallelRates.created_at} DESC
                LIMIT 
                    1
            ) base_currency
            ON TRUE
            
            LEFT JOIN LATERAL (
                SELECT 
                    p.${ParallelRates.rate} set_rate,
                    nr.rate curr_rate
                FROM 
                    ${ParallelRates.$$NAME} p
                LEFT JOIN
                    new_rates nr
                on 
                    nr.currency_id = p.${ParallelRates.currency_id}
                WHERE 
                    p.${ParallelRates.currency_id} = pa.${RateAlerts.quota} AND
                    p.${ParallelRates.created_at} <= pa.${RateAlerts.created_at}
                ORDER BY
                    p.${ParallelRates.created_at} DESC
                LIMIT 
                    1
            )  quota_currency
            ON TRUE

            LEFT JOIN LATERAL (
                SELECT 
                    quota_currency.set_rate/(base_currency.set_rate) set_rate,
                    (quota_currency.curr_rate)/(base_currency.curr_rate) curr_rate
            ) pairs
            ON TRUE
            WHERE
                ((
                    pa.${RateAlerts.target_rate} >= pairs.set_rate AND
                    pa.${RateAlerts.target_rate} <= pairs.curr_rate 
                ) OR
                (
                    pa.${RateAlerts.target_rate} <= pairs.set_rate AND
                    pa.${RateAlerts.target_rate} >= pairs.curr_rate 
                )) AND
                ${RateAlerts.triggered_at} IS NULL
        ),

        triggered_alerts AS (
            UPDATE ${RateAlerts.$$NAME} pa
            SET
                ${RateAlerts.triggered_at} = NOW()
            FROM 
                triggering_alerts ta
            LEFT JOIN 
                ${OfficialRateAlerts.$$NAME} official
            ON
                ta.${RateAlerts.rate_alerts_id} = official.${OfficialRateAlerts.rate_alerts_id}
            WHERE
                pa.${RateAlerts.rate_alerts_id} = ta.rate_alerts_id
            RETURNING 
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                official.${OfficialRateAlerts.user_id} user_id,
                pa.${RateAlerts.base} base_currency_id,
                pa.${RateAlerts.quota} quota_currency_id,
                pa.${RateAlerts.target_rate} target_rate,
                ta.is_up is_up
        ),
        pending_notification_details AS (
            SELECT
                ta.user_id user_id,
                base_currency.${Currencies.iso} base_currency_abbrev,
                quota_currency.${Currencies.iso} quota_currency_abbrev,
                ta.is_up is_up,
                ta.target_rate target_rate
            FROM 
                triggered_alerts ta
            LEFT JOIN
                ${Currencies.$$NAME} base_currency
            ON
                ta.base_currency_id = base_currency.${Currencies.currency_id}
            LEFT JOIN
                ${Currencies.$$NAME} quota_currency
            ON
                ta.quota_currency_id = quota_currency.${Currencies.currency_id}
        )

        INSERT INTO ${Notifications.$$NAME}
        (
            ${Notifications.user_id},
            ${Notifications.type},
            ${Notifications.msg}
        )
        SELECT
            user_id,
            'P',
            base_currency_abbrev || '/' || quota_currency_abbrev || ' has reached ' || target_rate 
        FROM 
            pending_notification_details pnd
    `;

    static HasAllCurrenciesRateQuery = `
        WITH currencies AS (
            SELECT COUNT(*) AS total FROM ${Currencies.$$NAME}
        ),
        available_currencies_with_rate AS (
            SELECT DISTINCT ${ParallelRates.currency_id}
            FROM ${ParallelRates.$$NAME}
        )

        SELECT (SELECT total FROM currencies) <= (SELECT COUNT(*) FROM available_currencies_with_rate) AS has_all_currencies_rate
    `;
}