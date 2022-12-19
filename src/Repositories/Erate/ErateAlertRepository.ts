import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import * as TableDataType from '../../Database/Erate/Tables';
import _ from 'lodash';
import {
    BlackRates,
    Currencies,
    Notifications,
    ParallelRates,
    RateAlerts,
    UserFavouritePairs,
    OfficialRateAlerts,
    BankRateAlerts,
    Users,
} from '../../Database/Erate/Tables';
import { NotificationType } from '../../Application/Common/Interfaces/Repositories/NotificationRepository';

type RawCurrencyModel = typeof TableDataType['Currencies'];
type RawPriceAlertModel = typeof TableDataType.RateAlerts;

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

    async getAAlllert(inData: {
        filter: {
            baseIds?: number[];
            quotaIds?: number[];
            userId: string;
            rateAlertIds?: string[];
            minCreatedAt?: Date;
            maxCreatedAt?: Date;
            minTriggeredAt?: Date;
            maxTriggeredAt?: Date;
            offset: number;
            limit: number;
            unTriggeredOnly?: boolean;
            triggeredOnly?: boolean;
        };
    }) {
        console.log('FILTER', inData.filter);
        const result: QueryResult<{
            rate_alerts_id: string;
            base_id: string;
            quota_id: string;
            target_rate: number;
            created_at: Date;
            triggered_at: Date;
            observed_user_id: string;
            observed_user_name: string;
        }> = await this.runner.run(
            AlertRepository.GetAllAlertQuery,
            inData.filter.baseIds,
            inData.filter.quotaIds,
            inData.filter.userId,
            inData.filter.rateAlertIds,
            inData.filter.minCreatedAt,
            inData.filter.maxCreatedAt,
            inData.filter.minTriggeredAt,
            inData.filter.maxTriggeredAt,
            inData.filter.unTriggeredOnly,
            inData.filter.triggeredOnly,
            inData.filter.offset,
            inData.filter.limit,
        );
        return _.map(result.rows, (row) => {
            return {
                rateAlertId: row.rate_alerts_id,
                baseCurrencyId: row.base_id,
                quotaCurrencyId: row.quota_id,
                targetRate: row.target_rate,
                createdAt: row.created_at,
                triggeredAt: row.triggered_at,
                observedUserId: row.observed_user_id,
                observedUserName: row.observed_user_name,
            };
        });
    }

    async setOfficialAlert(inData: {
        alert: {
            userId: string;
            baseCurrencyId: number;
            quotaCurrencyId: number;
            targetRate: string;
        };
    }) {
        const result: QueryResult<{
            rate_alerts_id: string;
            base_id: string;
            quota_id: string;
            target_rate: number;
            created_at: Date;
            triggered_at: Date;
            observed_user_id: string;
            observed_user_name: string;
        }> = await this.runner.run(
            AlertRepository.SetOfficialAlertQuery,
            inData.alert.userId,
            inData.alert.baseCurrencyId,
            inData.alert.quotaCurrencyId,
            inData.alert.targetRate,
        );
        const row = result.rows[0];
        return {
            rateAlertId: row.rate_alerts_id,
            baseCurrencyId: row.base_id,
            quotaCurrencyId: row.quota_id,
            targetRate: row.target_rate,
            createdAt: row.created_at,
            triggeredAt: row.triggered_at,
            observedUserId: row.observed_user_id,
            observedUserName: row.observed_user_name,
        };
    }

    async setBankAlert(inData: {
        alert: {
            userId: string;
            baseCurrencyId: number;
            quotaCurrencyId: number;
            bankUserId: string;
            targetRate: string;
        };
    }) {
        console.log('ALERT', inData.alert);
        const result: QueryResult<{
            rate_alerts_id: string;
            base_id: string;
            quota_id: string;
            target_rate: number;
            created_at: Date;
            triggered_at: Date;
            observed_user_id: string;
            observed_user_name: string;
        }> = await this.runner.run(
            AlertRepository.SetBankAlertQuery,
            inData.alert.userId,
            inData.alert.bankUserId,
            inData.alert.baseCurrencyId,
            inData.alert.quotaCurrencyId,
            inData.alert.targetRate,
        );
        const row = result.rows[0];

        return {
            rateAlertId: row.rate_alerts_id,
            baseCurrencyId: row.base_id,
            quotaCurrencyId: row.quota_id,
            targetRate: row.target_rate,
            createdAt: row.created_at,
            triggeredAt: row.triggered_at,
            observedUserId: row.observed_user_id,
            observedUserName: row.observed_user_name,
        };
    }

    async deleteOfficialAlert(inData: {
        alert: { rateAlertId: string; userId: string };
    }): Promise<boolean> {
        const result = await this.runner.run(
            AlertRepository.DeleteOfficialAlertQuery,
            inData.alert.rateAlertId,
            inData.alert.userId,
        );
        return !!result.rowCount;
    }

    async deleteRateBankAlert(inData: {
        alert: { rateAlertId: string; userId: string };
    }): Promise<boolean> {
        const result = await this.runner.run(
            AlertRepository.DeleteRateAlertQuery,
            inData.alert.rateAlertId,
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

    private static SetOfficialAlertQuery = `
        WITH in_data AS (
            SELECT * FROM (VALUES ((%L)::TEXT, (%L)::INTEGER, (%L)::INTEGER, (%L)::NUMERIC)) 
            AS t(
                user_id,
                base,
                quota,
                target_rate
            )
        ),
        inserted_alert AS (
            INSERT INTO ${RateAlerts.$$NAME}
            (
                ${RateAlerts.base},
                ${RateAlerts.quota},
                ${RateAlerts.target_rate}
            )
            SELECT base, quota, target_rate FROM in_data
            RETURNING 
                ${RateAlerts.rate_alerts_id} rate_alerts_id,
                ${RateAlerts.base} base,
                ${RateAlerts.quota} quota,
                ${RateAlerts.target_rate} target_rate,
                ${RateAlerts.created_at} created_at,
                ${RateAlerts.triggered_at} triggered_at
        ),
        inserted_official_rate AS (
            INSERT INTO ${OfficialRateAlerts.$$NAME}
            (
                ${OfficialRateAlerts.rate_alerts_id},
                ${OfficialRateAlerts.user_id}
            )
            VALUES (
                (SELECT rate_alerts_id FROM inserted_alert),
                (SELECT user_id::UUID FROM in_data)
            )
            RETURNING 
                ${OfficialRateAlerts.rate_alerts_id} rate_alerts_id,  
                ${OfficialRateAlerts.user_id} user_id
        )

        SELECT
            alert.rate_alerts_id,
            alert.base,
            alert.quota,
            alert.created_at,
            alert.target_rate,
            alert.triggered_at,
            NULL observed_user_id,
            '(OFFICIAL)' observed_user_name
        FROM
            inserted_alert  alert
        LEFT JOIN
            inserted_official_rate officials
        ON
            officials.rate_alerts_id = alert.rate_alerts_id
    `;

    private static SetBankAlertQuery = `
        WITH in_data AS (
            SELECT * FROM (VALUES ((%L)::TEXT, (%L)::TEXT, (%L)::INTEGER, (%L)::INTEGER, (%L)::NUMERIC)) 
            AS t(
                user_id,
                bank_id,
                base,
                quota,
                target_rate
            )
        ),
        inserted_alert AS (
            INSERT INTO ${RateAlerts.$$NAME}
            (
                ${RateAlerts.base},
                ${RateAlerts.quota},
                ${RateAlerts.target_rate}
            )
            SELECT base, quota, target_rate FROM in_data
            RETURNING 
                ${RateAlerts.rate_alerts_id} rate_alerts_id,
                ${RateAlerts.base} base,
                ${RateAlerts.quota} quota,
                ${RateAlerts.target_rate} target_rate,
                ${RateAlerts.created_at} created_at,
                ${RateAlerts.triggered_at} triggered_at
        ),
        inserted_bank_rates AS (
            INSERT INTO ${BankRateAlerts.$$NAME}
            (
                ${BankRateAlerts.rate_alerts_id},
                ${BankRateAlerts.user_id},
                ${BankRateAlerts.bank_user_id}
            )
            VALUES (
                (SELECT rate_alerts_id::UUID FROM inserted_alert),
                (SELECT user_id::UUID FROM in_data),
                (SELECT bank_id::UUID FROM in_data)
            )
            RETURNING 
                ${OfficialRateAlerts.rate_alerts_id} rate_alerts_id,  
                ${OfficialRateAlerts.user_id} user_id
        )

        SELECT
            alert.rate_alerts_id rate_alerts_id,
            alert.base base_id,
            alert.quota quota_id,
            alert.created_at created_at,
            alert.target_rate target_rate,
            alert.triggered_at triggered_at,
			bank_users.${Users.user_id} observed_user_id,
			bank_users.${Users.name} observed_user_name
        FROM
            inserted_alert alert
        LEFT JOIN 
			inserted_bank_rates  banks
		ON 
			banks.rate_alerts_id = alert.rate_alerts_id
		LEFT JOIN
            ${Users.$$NAME} bank_users
		ON
			banks.user_id = bank_users.${Users.user_id}
    `;

    private static DeleteOfficialAlertQuery = `
        WITH in_data AS (
            SELECT * FROM (VALUES ((%L)::TEXT, (%L)::TEXT) 
            AS t(
                rate_alerts_id,
                user_id
            )
        )

        UPDATE ${RateAlerts.$$NAME}
        SET
            ${RateAlerts.deleted_at} = NOW()
        WHERE
            ${RateAlerts.rate_alerts_id} IN (
                SELECT  
                    alert.${RateAlerts.rate_alerts_id}
                FROM 
                    ${RateAlerts.$$NAME} alert
                LEFT JOIN
                    ${OfficialRateAlerts.$$NAME} official
                ON 
                    official.${OfficialRateAlerts.rate_alerts_id} = alert.${RateAlerts.rate_alerts_id}
                WHERE 
                    official.${OfficialRateAlerts.rate_alerts_id} = (SELECT rate_alerts_id FROM in_data) AND
                    official.${OfficialRateAlerts.user_id} = (SELECT user_id FROM in_data) 
            )
    `;

    private static DeleteRateAlertQuery = `
        WITH in_data AS (
            SELECT * FROM (VALUES ((%L)::TEXT, (%L)::TEXT) 
            AS t(
                rate_alerts_id,
                user_id
            )
        )

        UPDATE ${RateAlerts.$$NAME}
        SET
            ${RateAlerts.deleted_at} = NOW()
        WHERE
            ${RateAlerts.rate_alerts_id} IN (
                SELECT  
                    alert.${RateAlerts.rate_alerts_id}
                FROM 
                    ${RateAlerts.$$NAME} alert
                LEFT JOIN
                    ${BankRateAlerts.$$NAME} bank
                ON 
                    bank.${BankRateAlerts.rate_alerts_id} = alert.${RateAlerts.rate_alerts_id}
                WHERE 
                    bank.${BankRateAlerts.rate_alerts_id} = (SELECT rate_alerts_id FROM in_data) AND
                    bank.${BankRateAlerts.user_id} = (SELECT user_id FROM in_data) 
            )
    `;

    private static GetAllAlertQuery = `
        WITH in_data AS (
            SELECT * 
            FROM (VALUES (
                (%L)::INTEGER, 
                (%L)::INTEGER, 
                (%L)::TEXT, 
                (%L)::TEXT,
                (%L)::TIMESTAMPTZ, 
                (%L)::TIMESTAMPTZ, 
                (%L)::TIMESTAMPTZ, 
                (%L)::TIMESTAMPTZ,
                (%L)::BOOLEAN,
                (%L)::BOOLEAN,
                (%L)::INTEGER, 
                (%L)::INTEGER
            )) 
            AS t(
                base_ids,
                quota_ids,
                user_id,
                rate_alert_ids, 
                min_created_at,
                max_created_at,
                min_triggered_at,
                max_triggered_at,
                triggered_only,
                un_triggered_only,
                _offset,
                _limit
            )
        ),

        alerts AS (
            SELECT
                ${RateAlerts.rate_alerts_id} rate_alerts_id,
                ${RateAlerts.base} base_id,
                ${RateAlerts.quota} quota_id,
                ${RateAlerts.created_at} created_at,
                ${RateAlerts.target_rate} target_rate,
                ${RateAlerts.triggered_at} triggered_at
            FROM
                ${RateAlerts.$$NAME} alert
            WHERE
                ((SELECT rate_alert_ids FROM in_data) IS NULL OR alert.${RateAlerts.rate_alerts_id}::TEXT IN (SELECT rate_alert_ids FROM in_data)) AND
                ((SELECT base_ids FROM in_data) IS NULL OR alert.${RateAlerts.base} IN (SELECT base_ids FROM in_data)) AND
                ((SELECT quota_ids FROM in_data) IS NULL OR alert.${RateAlerts.quota} IN (SELECT quota_ids FROM in_data)) AND
                ((SELECT min_created_at FROM in_data) IS NULL OR alert.${RateAlerts.created_at} >= (SELECT min_created_at FROM in_data)) AND
                ((SELECT max_created_at FROM in_data) IS NULL OR alert.${RateAlerts.created_at} <= (SELECT max_created_at FROM in_data)) AND
                ((SELECT min_triggered_at FROM in_data) IS NULL OR alert.${RateAlerts.triggered_at} >= (SELECT min_triggered_at FROM in_data)) AND
                ((SELECT max_triggered_at FROM in_data) IS NULL OR alert.${RateAlerts.triggered_at} <= (SELECT max_triggered_at FROM in_data)) AND
                ((SELECT triggered_only FROM in_data) IS NULL OR alert.${RateAlerts.triggered_at} IS NOT NULL) AND
                ((SELECT un_triggered_only FROM in_data) IS NULL OR alert.${RateAlerts.triggered_at} IS  NULL) AND
                ${RateAlerts.deleted_at} IS NOT NULL
        ),

        alerts_with_name AS (
            SELECT 
                alerts.*,
                NULL observed_user_id,
                '(OFFICIAL)' observed_user_name
            FROM 
                alerts
            INNER JOIN
                ${OfficialRateAlerts.$$NAME} officials
            ON
                officials.${OfficialRateAlerts.rate_alerts_id} = alerts.rate_alerts_id
            WHERE 
                officials.${OfficialRateAlerts.user_id}::TEXT = (SELECT user_id FROM in_data)

            UNION ALL

            SELECT 
                alerts.*,
                bank_users.${Users.user_id} observed_user_id,
                bank_users.${Users.name} observed_user_name
            FROM 
                alerts
            INNER JOIN
                ${BankRateAlerts.$$NAME} banks
            ON
                banks.${BankRateAlerts.rate_alerts_id} = alerts.rate_alerts_id
            LEFT JOIN
                ${Users.$$NAME} bank_users
            ON 
                bank_users.${Users.user_id} = banks.${BankRateAlerts.bank_user_id}
            WHERE 
                banks.${BankRateAlerts.user_id}::TEXT = (SELECT user_id FROM in_data)
        )

        SELECT *
        FROM alerts_with_name
        OFFSET (SELECT _offset FROM in_data)
        LIMIT (SELECT _limit FROM in_data)
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
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                pairs.curr_rate >= pairs.set_rate is_up
            FROM 
                ${RateAlerts.$$NAME} pa
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
                    lr.rate curr_rate
                FROM 
                    ${ParallelRates.$$NAME} p
                LEFT JOIN
                    lastest_rates lr
                on 
                    lr.currency_id = p.${ParallelRates.currency_id}
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
                (
                    pa.${RateAlerts.target_rate} <= pairs.set_rate AND
                    pa.${RateAlerts.target_rate} <= pairs.curr_rate 
                ) OR
                (
                    pa.${RateAlerts.target_rate} >= pairs.set_rate AND
                    pa.${RateAlerts.target_rate} >= pairs.curr_rate 
                )
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
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                pairs.curr_rate >= pairs.set_rate is_up
            FROM 
                ${RateAlerts.$$NAME} pa
            INNER JOIN 
                avg_lastest_rates alr
            ON 
                alr.base = pa.${RateAlerts.base} AND
                alr.quota = pa.${RateAlerts.quota}
            INNER JOIN LATERAL (
                WITH users_nullable_lastest_rates AS (
                    SELECT DISTINCT 
                        ON (${BlackRates.user_id})
                        ${BlackRates.user_id} user_id,
                        FIRST_VALUE(${BlackRates.rate}) OVER w rate
                    FROM 
                        ${BlackRates.$$NAME} 
                    WHERE 
                        ${BlackRates.base} = pa.${RateAlerts.base} AND
                        ${BlackRates.quota} = pa.${RateAlerts.quota} AND
                        ${BlackRates.created_at} <= pa.${RateAlerts.created_at}
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
                    pa.${RateAlerts.target_rate} >= alr.rate AND
                    pa.${RateAlerts.target_rate} >= asr.rate 
                ) OR
                (
                    pa.${RateAlerts.target_rate} <= alr.rate  AND
                    pa.${RateAlerts.target_rate} <= asr.rate 
                )
        ),

        triggered_alerts AS (
            UPDATE ${RateAlerts.$$NAME} pa
            SET
                ${RateAlerts.triggered_at} = NOW()
            FROM 
                triggering_alerts ta
            LEFT JOIN
                ${BankRateAlerts.$$NAME} banks
            ON
                banks.${BankRateAlerts.rate_alerts_id} = ta.${RateAlerts.rate_alerts_id}
            WHERE
                pa.${RateAlerts.rate_alerts_id} = ta.rate_alerts_id
            RETURNING 
                pa.${RateAlerts.rate_alerts_id} rate_alerts_id,
                banks.${BankRateAlerts.user_id} user_id,
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
            (SELECT notification_type FROM in_data),
            base_currency_abbrev || '/' || quota_currency_abbrev || ' has reached ' || target_rate 
        FROM 
            pending_notification_details pnd
    `;
}
