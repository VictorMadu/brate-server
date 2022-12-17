import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Currencies, UserFavouritePairs } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import Currency from '../../Application/Common/Interfaces/Entities/Currency';
import PairFavourite from '../../Application/Common/Interfaces/Entities/CurrencyPair';
import { User } from '../../Application/Common/Interfaces/Entities/User';

type RawCurrencyModel = TableDataType.Currency;
type RawUserFavouritePairModel = TableDataType.UserFavouritePair;
type RawPriceAlertModel = TableDataType.PriceAlert;

export interface Filter {
    fromTime: Date | null;
    toTime: Date | null;
    type: 'P' | 'F' | 'T' | null;
    offset: number;
    size: number;
}

export default class CurrenciesRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async saveCurrencies(inData: { currencies: { abbrev: string; name: string }[] }) {
        const result: QueryResult = await this.runner.run(
            CurrenciesRepository.UpdateCurrenciesQuery,
            inData.currencies.map((currency) => {
                return [currency.abbrev, currency.name];
            }),
        );

        return !!result.rowCount;
    }

    async findMany(): Promise<Currency[]> {
        const result: QueryResult<RawCurrencyModel> = await this.runner.run(
            CurrenciesRepository.GetQuery,
        );

        return _.map(result.rows, (row): Currency => {
            return {
                currencyId: row.currency_id,
                abbrev: row.iso,
                name: row.name,
            };
        });
    }

    async findOneFavourite(inData: {
        filter: { user: Pick<User, 'userId'>; base: string; quota: string };
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
        filter: {
            user: Pick<User, 'userId'>;
            base: string;
            quota: string;
            offset: number;
            size: number;
        };
    }): Promise<PairFavourite[]> {
        return this._getFavourite(inData);
    }

    async setFavourite(inData: {
        pairFavourite: Pick<PairFavourite, 'base' | 'quota' | 'userId'>;
    }) {
        await this.runner.run(CurrenciesRepository.SetFavouriteQuery, [
            [inData.pairFavourite.userId, inData.pairFavourite.base, inData.pairFavourite.quota],
        ]);
    }

    async unSetFavourite(inData: {
        pairFavourite: Pick<PairFavourite, 'base' | 'quota' | 'userId'>;
    }) {
        await this.runner.run(
            CurrenciesRepository.UnSetFavouriteQuery,
            inData.pairFavourite.userId,
            inData.pairFavourite.base,
            inData.pairFavourite.quota,
        );
    }

    private async _getFavourite(inData: {
        filter: {
            user: Pick<User, 'userId'>;
            base: string;
            quota: string;
            offset: number;
            size: number;
        };
    }): Promise<PairFavourite[]> {
        const result: QueryResult<RawUserFavouritePairModel> = await this.runner.run(
            CurrenciesRepository.GetFavouriteQuery,
            inData.filter.user.userId,
            inData.filter.base,
            inData.filter.quota,
            inData.filter.offset,
            inData.filter.size,
        );

        return _.map(result.rows, (row): PairFavourite => {
            return {
                userId: row.user_id,
                base: row.base,
                quota: row.quota,
                createdAt: row.created_at,
                deletedAt: row.deleted_at,
            };
        });
    }

    private static GetQuery = `
        SELECT 
            ${Currencies.currency_id} currency_id,
            ${Currencies.iso} iso,
            ${Currencies.name} name
        FROM 
            ${Currencies.$$NAME}
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

    private static UpdateCurrenciesQuery = `
        INSERT INTO ${Currencies.$$NAME}
        (
            ${Currencies.iso},
            ${Currencies.name}
        )
        VALUES %L
        ON CONFLICT (${Currencies.iso})
        DO UPDATE SET
            ${Currencies.name} = EXCLUDED.${Currencies.name}
    `;
}
