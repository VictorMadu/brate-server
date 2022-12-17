import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { PriceAlerts, UserFavouritePairs } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import PriceAlert from '../../Application/Common/Interfaces/Entities/PriceAlert';
import { BlackRates, Currencies, Notifications, ParallelRates } from '../../Database/Erate/Tables';
import { NotificationType } from '../../Application/Common/Interfaces/Repositories/NotificationRepository';

type RawCurrencyModel = TableDataType.Currency;
type RawPriceAlertModel = TableDataType.PriceAlert;

export interface CurrencyModel {
    id: RawCurrencyModel['currency_id'];
    iso: RawCurrencyModel['iso'];
    name: RawCurrencyModel['name'];
}

export interface Filter {
    fromTime: Date | null;
    toTime: Date | null;
    type: 'P' | 'F' | 'T' | null;
    offset: number;
    size: number;
}

export default class AlertRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async getAlert(inData: {
        filter: {
            userId: string;
            pairs: { base: string; quota: string }[];
            marketType?: 'P' | 'B';
            minCreatedAt?: number;
            maxCreatedAt?: number;
            minTriggeredAt?: number;
            maxTriggeredAt?: number;
            isTriggered?: boolean;
            isNotTriggered?: boolean;
            offset: number;
            size: number;
        };
    }): Promise<PriceAlert[]> {
        const result: QueryResult<RawPriceAlertModel> = await this.runner.run(
            AlertRepository.GetAlertQuery,
            inData.filter.userId,
            inData.filter.pairs.map((pair) => pair.base + pair.quota),
            inData.filter.pairs.map((pair) => pair.base + pair.quota),
            inData.filter.marketType,
            inData.filter.marketType,
            inData.filter.minCreatedAt,
            inData.filter.minCreatedAt,
            inData.filter.maxCreatedAt,
            inData.filter.maxCreatedAt,
            inData.filter.minTriggeredAt,
            inData.filter.minTriggeredAt,
            inData.filter.maxTriggeredAt,
            inData.filter.maxTriggeredAt,
            inData.filter.isTriggered,
            inData.filter.isNotTriggered,
            inData.filter.offset,
            inData.filter.size,
        );
        return _.map(result.rows, (row): PriceAlert => {
            return {
                priceAlertId: row.price_alert_id,
                userId: row.user_id,
                base: row.base,
                quota: row.quota,
                marketType: row.market_type,
                // setRate: row.set_rate,
                targetRate: row.target_rate,
                createdAt: row.created_at,
                triggeredAt: row.triggered_at,
            };
        });
    }

    async setAlert(inData: {
        alert: Pick<PriceAlert, 'base' | 'quota' | 'userId' | 'marketType' | 'targetRate'>;
    }): Promise<Pick<PriceAlert, 'priceAlertId'>> {
        const result: QueryResult<Pick<RawPriceAlertModel, 'price_alert_id'>> =
            await this.runner.run(AlertRepository.SetAlertQuery, [
                [
                    inData.alert.userId,
                    inData.alert.base,
                    inData.alert.quota,
                    inData.alert.marketType,
                    inData.alert.targetRate,
                ],
            ]);
        return { priceAlertId: result.rows[0].price_alert_id };
    }

    async deleteAlert(inData: {
        alert: Pick<PriceAlert, 'priceAlertId' | 'userId'>;
    }): Promise<boolean> {
        const result = await this.runner.run(
            AlertRepository.DeleteAlertQuery,
            inData.alert.priceAlertId,
            inData.alert.userId,
        );
        return !!result.rowCount;
    }

    async triggerReachedParallelMarket(inData: { type: NotificationType }) {
        await this.runner.run(AlertRepository.ParallelPriceTriggerQuery, inData.type);
    }

    async triggerReachedBlackMarket(inData: {
        type: NotificationType;
        blackMarketUserIds: string[];
    }) {
        await this.runner.run(
            AlertRepository.BlackPriceTriggerQuery,
            inData.type,
            inData.blackMarketUserIds,
        );
    }

    private static SetAlertQuery = `
        INSERT INTO ${PriceAlerts.$$NAME}
        (
            ${PriceAlerts.user_id},
            ${PriceAlerts.base},
            ${PriceAlerts.quota},
            ${PriceAlerts.market_type},
            ${PriceAlerts.target_rate}
        ) 
        VALUES %L
        RETURNING ${PriceAlerts.price_alert_id} AS price_alert_id
    `;

    private static DeleteAlertQuery = `
        UPDATE ${PriceAlerts.$$NAME}
        SET
            ${PriceAlerts.deleted_at} = NOW()
        WHERE
            ${PriceAlerts.price_alert_id} = %L AND
            ${PriceAlerts.user_id} = %L 
    `;

    private static GetAlertQuery = `
        SELECT 
            *
        FROM 
            ${PriceAlerts.$$NAME}
        WHERE
            ${PriceAlerts.user_id} = %L AND  
            (
                %L IS NULL OR 
                ${PriceAlerts.base} || ${PriceAlerts.quota} IN (%L)  
            ) AND
            (
                %L IS NULL OR 
                ${PriceAlerts.market_type}  = %L
            ) AND
            (
                (%L IS NULL OR ${PriceAlerts.created_at} >= to_timestamp(%L)::TIMESTAMPTZ) AND 
                (%L IS NULL OR ${PriceAlerts.created_at} <= to_timestamp(%L)::TIMESTAMPTZ)
            ) AND
            (
                (%L IS NULL OR ${PriceAlerts.triggered_at} >= to_timestamp(%L)::TIMESTAMPTZ) AND 
                (%L IS NULL OR ${PriceAlerts.triggered_at} <= to_timestamp(%L)::TIMESTAMPTZ)
            ) AND (
                %L IS NULL OR ${PriceAlerts.triggered_at} IS NOT NULL
            ) AND (
                %L IS NULL OR ${PriceAlerts.triggered_at} IS NULL
            )
            ${PriceAlerts.deleted_at} IS NULL
        OFFSET %L
        LIMIT %L
    `;

    private static ParallelPriceTriggerQuery = `
        WITH in_data AS  (
            SELECT 
                *
            FROM
            (VALUES (%L))
            AS t(notification_type)
        ),
        lastest_rates AS (
            SELECT DISTINCT 
                ON (${ParallelRates.currency_id})
                ${ParallelRates.currency_id} currency_id,
                FIRST_VALUE(${ParallelRates.rate}) OVER w rate
            FROM 
                ${ParallelRates.$$NAME} 
            WINDOW w AS (
                PARTITION BY ${ParallelRates.currency_id}
                ORDER BY ${ParallelRates.created_at}
            )
        ),
        triggering_alerts AS (
            SELECT 
                pa.${PriceAlerts.price_alert_id} price_alert_id,
                pairs.curr_rate >= pairs.set_rate is_up
            FROM 
                ${PriceAlerts.$$NAME} pa
            LEFT JOIN LATERAL (
                SELECT 
                    p.${ParallelRates.rate} set_rate,
                    lr.rate curr_rate
                FROM 
                    ${ParallelRates.$$NAME} p
                LEFT JOIN
                    lastest_rates lr
                ON 
                    lr.currency_id = p.${ParallelRates.currency_id}
                WHERE 
                    p.${ParallelRates.currency_id} = pa.${PriceAlerts.base} AND
                    p.${ParallelRates.created_at} <= pa.${PriceAlerts.created_at}
                ORDER BY
                    p.${ParallelRates.created_at} DESC
                LIMIT 
                    1
            ) base_currency
            ON TRUE
            
            LEFT JOIN LATERAL (
                SELECT 
                    p.${ParallelRates.rate} set_rate,
                    lr.rate curr_rate
                FROM 
                    ${ParallelRates.$$NAME} p
                LEFT JOIN
                    lastest_rates lr
                on 
                    lr.currency_id = p.${ParallelRates.currency_id}
                WHERE 
                    p.${ParallelRates.currency_id} = pa.${PriceAlerts.quota} AND
                    p.${ParallelRates.created_at} <= pa.${PriceAlerts.created_at}
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
                (
                    pa.${PriceAlerts.target_rate} <= pairs.set_rate AND
                    pa.${PriceAlerts.target_rate} <= pairs.curr_rate 
                ) OR
                (
                    pa.${PriceAlerts.target_rate} >= pairs.set_rate AND
                    pa.${PriceAlerts.target_rate} >= pairs.curr_rate 
                )
        ),

        triggered_alerts AS (
            UPDATE ${PriceAlerts.$$NAME} pa
            SET
                ${PriceAlerts.triggered_at} = NOW()
            FROM 
                triggering_alerts ta
            WHERE
                pa.${PriceAlerts.price_alert_id} = ta.price_alert_id
            RETURNING 
                pa.${PriceAlerts.price_alert_id} price_alert_id,
                pa.${PriceAlerts.user_id} user_id,
                pa.${PriceAlerts.base} base_currency_id,
                pa.${PriceAlerts.quota} quota_currency_id,
                pa.${PriceAlerts.target_rate} target_rate,
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
            (SELECT notification_type FROM in_data),
            base_currency_abbrev || '/' || quota_currency_abbrev || ' has reached ' || target_rate 
        FROM 
            pending_notification_details pnd
    `;
    private static BlackPriceTriggerQuery = `
        WITH in_data AS  (
            SELECT 
                *
            FROM
            (VALUES (%L, %L))
            AS t(notification_type, black_market_user_ids)
        ),
        users_nullable_lastest_rates AS (
            SELECT DISTINCT 
                ON (${BlackRates.base}, ${BlackRates.quota}, ${BlackRates.user_id})
                ${BlackRates.base} base,
                ${BlackRates.quota} quota,
                ${BlackRates.user_id} user_id,
                FIRST_VALUE(${BlackRates.rate}) OVER w rate
            FROM 
                ${BlackRates.$$NAME} 
            WHERE
                (
                    (SELECT black_market_user_ids FROM in_data) IS NULL OR
                    ${BlackRates.user_id} IN (SELECT black_market_user_ids FROM in_data)
                )
            WINDOW w AS (
                PARTITION BY ${BlackRates.base}, ${BlackRates.quota}, ${BlackRates.user_id}
                ORDER BY ${BlackRates.created_at} DESC
        ),
        avg_lastest_rates AS (
            SELECT 
                base,
                quota,
                AVG(rate) rate
            FROM 
                users_nullable_lastest_rates
            GROUP BY
                base, quota
            WHERE 
                rate IS NOT NULL
        ),
        triggering_alerts AS (
            SELECT 
                pa.${PriceAlerts.price_alert_id} price_alert_id,
                pairs.curr_rate >= pairs.set_rate is_up
            FROM 
                ${PriceAlerts.$$NAME} pa
            INNER JOIN 
                avg_lastest_rates alr
            ON 
                alr.base = pa.${PriceAlerts.base} AND
                alr.quota = pa.${PriceAlerts.quota}
            INNER JOIN LATERAL (
                WITH users_nullable_lastest_rates AS (
                    SELECT DISTINCT 
                        ON (${BlackRates.user_id})
                        ${BlackRates.user_id} user_id,
                        FIRST_VALUE(${BlackRates.rate}) OVER w rate
                    FROM 
                        ${BlackRates.$$NAME} 
                    WHERE 
                        ${BlackRates.base} = pa.${PriceAlerts.base} AND
                        ${BlackRates.quota} = pa.${PriceAlerts.quota} AND
                        ${BlackRates.created_at} <= pa.${PriceAlerts.created_at}
                    WINDOW w AS (
                        PARTITION BY ${BlackRates.user_id}
                        ORDER BY ${BlackRates.created_at} DESC
                )
                SELECT 
                    AVG(rate) rate
                FROM 
                    users_nullable_lastest_rates
                WHERE 
                    rate IS NOT NULL
            ) avg_set_rates asr
            ON TRUE
            WHERE
                (
                    pa.${PriceAlerts.target_rate} >= alr.rate AND
                    pa.${PriceAlerts.target_rate} >= asr.rate 
                ) OR
                (
                    pa.${PriceAlerts.target_rate} <= alr.rate  AND
                    pa.${PriceAlerts.target_rate} <= asr.rate 
                )
        ),

        triggered_alerts AS (
            UPDATE ${PriceAlerts.$$NAME} pa
            SET
                ${PriceAlerts.triggered_at} = NOW()
            FROM 
                triggering_alerts ta
            WHERE
                pa.${PriceAlerts.price_alert_id} = ta.price_alert_id
            RETURNING 
                pa.${PriceAlerts.price_alert_id} price_alert_id,
                pa.${PriceAlerts.user_id} user_id,
                pa.${PriceAlerts.base} base_currency_id,
                pa.${PriceAlerts.quota} quota_currency_id,
                pa.${PriceAlerts.target_rate} target_rate,
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
            (SELECT notification_type FROM in_data),
            base_currency_abbrev || '/' || quota_currency_abbrev || ' has reached ' || target_rate 
        FROM 
            pending_notification_details pnd
    `;
}
