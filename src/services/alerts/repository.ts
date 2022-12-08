import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Currencies, PriceAlerts, UserFavouritePairs } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';

type RawCurrencyModel = TableDataType.Currency;
type RawUserFavouritePairModel = TableDataType.UserFavouritePair;
type RawPriceAlertModel = TableDataType.PriceAlert;

interface UserModel {
    id: string;
}

export interface CurrencyModel {
    id: RawCurrencyModel['currency_id'];
    iso: RawCurrencyModel['iso'];
    name: RawCurrencyModel['name'];
}

export interface PairFavourite {
    id: RawUserFavouritePairModel['user_favourite_pairs_id'];
    userId: RawUserFavouritePairModel['user_id'];
    base: RawUserFavouritePairModel['base'];
    quota: RawUserFavouritePairModel['quota'];
    createdAt: RawUserFavouritePairModel['created_at'];
    deletedAt: RawUserFavouritePairModel['deleted_at'];
}

export interface Filter {
    fromTime: Date | null;
    toTime: Date | null;
    type: 'P' | 'F' | 'T' | null;
    offset: number;
    size: number;
}

export interface NotificationModel {
    id: string;
    userId: string;
    msg: string;
    type: 'P' | 'F' | 'T';
    createdAt: Date;
}

interface PriceAlertModel {
    id: RawPriceAlertModel['price_alert_id'];
    userId: RawPriceAlertModel['user_id'];
    marketType: RawPriceAlertModel['market_type'];
    base: RawPriceAlertModel['base'];
    quota: RawPriceAlertModel['quota'];
    setRate: RawPriceAlertModel['set_rate'];
    targetRate: RawPriceAlertModel['target_rate'];
    createdAt: RawPriceAlertModel['created_at'];
    triggeredAt: RawPriceAlertModel['triggered_at'];
}

export default class CurrenciesRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async getAlert(inData: {
        filter: {
            userId: string;
            pairs: [string, string][];
            marketType: 'P' | 'B';
            minCreatedAt: number;
            maxCreatedAt: number;
            minTriggeredAt: number;
            maxTriggeredAt: number;
        };
    }): Promise<PriceAlertModel[]> {
        const result: QueryResult<RawPriceAlertModel> = await this.runner.run(
            CurrenciesRepository.GetAlertQuery,
            inData.filter.userId,
            inData.filter.pairs.map((pair) => pair[0] + pair[1]),
            inData.filter.marketType,
            inData.filter.minCreatedAt,
            inData.filter.maxCreatedAt,
            inData.filter.minTriggeredAt,
            inData.filter.maxTriggeredAt,
        );
        return _.map(result.rows, (row): PriceAlertModel => {
            return {
                id: row.price_alert_id,
                userId: row.user_id,
                base: row.base,
                quota: row.quota,
                marketType: row.market_type,
                setRate: row.set_rate,
                targetRate: row.target_rate,
                createdAt: row.created_at,
                triggeredAt: row.triggered_at,
            };
        });
    }

    async setAlert(inData: {
        alertModel: Pick<PriceAlertModel, 'base' | 'quota' | 'userId' | 'marketType'>;
    }): Promise<boolean> {
        const result: QueryResult<RawPriceAlertModel> = await this.runner.run(
            CurrenciesRepository.SetAlertQuery,
            [
                [
                    inData.alertModel.userId,
                    inData.alertModel.base,
                    inData.alertModel.quota,
                    inData.alertModel.marketType,
                ],
            ],
        );
        return !!result.rowCount;
    }

    async deleteAlert(inData: { alertModel: Pick<PriceAlertModel, 'id'> }): Promise<boolean> {
        const result = await this.runner.run(
            CurrenciesRepository.DeleteAlertQuery,
            inData.alertModel.id,
        );
        return !!result.rowCount;
    }

    private static SetAlertQuery = `
        INSERT INTO ${PriceAlerts.$$NAME}
        (
            ${PriceAlerts.user_id},
            ${PriceAlerts.base},
            ${PriceAlerts.quota},
            ${PriceAlerts.market_type}
        ) 
        VALUES %L
    `;

    private static DeleteAlertQuery = `
        UPDATE ${PriceAlerts.$$NAME}
        SET
            ${PriceAlerts.deleted_at} = NOW()
        WHERE
            ${PriceAlerts.user_id} = %L
    `;

    private static GetAlertQuery = `
        SELECT 
            *
        FROM 
            ${PriceAlerts.$$NAME}
        WHERE
            ${PriceAlerts.user_id} = %L AND  
            ${PriceAlerts.base} || ${PriceAlerts.quota} IN (%L) AND   
            ${PriceAlerts.market_type} IN (%L) AND
            (
                ${PriceAlerts.created_at} >= to_timestamp(%L)::TIMESTAMPTZ AND 
                ${PriceAlerts.created_at} <= to_timestamp(%L)::TIMESTAMPTZ
            ) AND
            (
                ${PriceAlerts.triggered_at} >= to_timestamp(%L)::TIMESTAMPTZ AND 
                ${PriceAlerts.triggered_at} <= to_timestamp(%L)::TIMESTAMPTZ
            ) AND
            ${PriceAlerts.deleted_at} IS NULL
        OFFSET %L
        LIMIT %L
    `;
}
