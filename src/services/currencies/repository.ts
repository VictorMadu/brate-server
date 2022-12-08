import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Currencies, UserFavouritePairs } from '../../databases/postgres/erate/tables';
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

export default class CurrenciesRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async findMany(): Promise<CurrencyModel[]> {
        const result: QueryResult<RawCurrencyModel> = await this.runner.run(
            CurrenciesRepository.GetQuery,
        );

        return _.map(result.rows, (row): CurrencyModel => {
            return {
                id: row.currency_id,
                iso: row.iso,
                name: row.name,
            };
        });
    }

    async findOneFavourite(inData: {
        filter: { userModel: UserModel; base: string; quota: string };
    }): Promise<PairFavourite> {
        const result = await this._getFavourite({
            filter: {
                ...inData.filter,
                offset: 0,
                size: 1,
            },
        });

        return result[0];
    }

    async getFavourite(inData: {
        filter: { userModel: UserModel; base: string; quota: string; offset: number; size: number };
    }): Promise<PairFavourite[]> {
        return this._getFavourite(inData);
    }

    async setFavourite(inData: {
        userPairFavouriteModels: Pick<PairFavourite, 'base' | 'quota' | 'userId'>;
    }) {
        await this.runner.run(CurrenciesRepository.SetFavouriteQuery, [
            [
                inData.userPairFavouriteModels.userId,
                inData.userPairFavouriteModels.base,
                inData.userPairFavouriteModels.quota,
            ],
        ]);
    }

    async unSetFavourite(inData: {
        userPairFavouriteModels: Pick<PairFavourite, 'base' | 'quota' | 'userId'>;
    }) {
        await this.runner.run(
            CurrenciesRepository.UnSetFavouriteQuery,
            inData.userPairFavouriteModels.userId,
            inData.userPairFavouriteModels.base,
            inData.userPairFavouriteModels.quota,
        );
    }

    private async _getFavourite(inData: {
        filter: { userModel: UserModel; base: string; quota: string; offset: number; size: number };
    }): Promise<PairFavourite[]> {
        const result: QueryResult<RawPriceAlertModel> = await this.runner.run(
            CurrenciesRepository.GetFavouriteQuery,
            inData.filter.userModel.id,
            inData.filter.base,
            inData.filter.quota,
            inData.filter.offset,
            inData.filter.size,
        );

        return _.map(result.rows, (row): PairFavourite => {
            return {
                id: row.price_alert_id,
                userId: row.user_id,
                base: row.base,
                quota: row.quota,
                createdAt: row.created_at,
                deletedAt: row.deleted_at,
            };
        });
    }

    private static GetQuery = `
        SELECT *
        FROM ${Currencies.$$NAME}
    `;

    private static GetFavouriteQuery = `
        SELECT 
            *
        FROM ${UserFavouritePairs.$$NAME}
        WHERE
            ${UserFavouritePairs.user_id} = %L AND 
            ${UserFavouritePairs.base} IS NOT NULL AND ${UserFavouritePairs.base} IN %L AND
            ${UserFavouritePairs.quota} IS NOT NULL AND ${UserFavouritePairs.quota} IN %L AND
        OFFSET %L
        LIMIT %L
    `;

    private static SetFavouriteQuery = `
        INSERT INTO ${UserFavouritePairs.$$NAME}
        (
            ${UserFavouritePairs.user_id},
            ${UserFavouritePairs.base},
            ${UserFavouritePairs.quota},
            ${UserFavouritePairs.created_at}
        )
        VALUES %L
        ON CONFLICT (
            ${UserFavouritePairs.user_id},
            ${UserFavouritePairs.base},
            ${UserFavouritePairs.quota}
        )
        DO UPDATE SET 
            ${UserFavouritePairs.created_at} = NOW() AND 
            ${UserFavouritePairs.deleted_at} IS NULL
        RETURNING ${UserFavouritePairs.user_favourite_pairs_id} id
    `;

    private static UnSetFavouriteQuery = `
        UPDATE ${UserFavouritePairs.$$NAME}
        SET 
            ${UserFavouritePairs.created_at} = NOW(),
            ${UserFavouritePairs.deleted_at} = NULL
        WHERE
            ${UserFavouritePairs.user_id} = %L AND 
            ${UserFavouritePairs.base} IS NOT NULL AND ${UserFavouritePairs.base} IN %L AND
            ${UserFavouritePairs.quota} IS NOT NULL AND ${UserFavouritePairs.quota} IN %L AND
            ${UserFavouritePairs.deleted_at} IS NOT NULL
        RETURNING ${UserFavouritePairs.user_favourite_pairs_id} id
    `;
}
