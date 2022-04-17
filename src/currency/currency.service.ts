import { Inject, Injectable } from "nist-core";
import { AuthParserService } from "utils/auth-manager.service";
import { CurrencyPostgresDbService } from "./currency.db.service";
import {
  Headers,
  Query,
  Response,
} from "./controller-handlers/get-currency-pair-list/interface";
import * as _ from "lodash";

const BASE_DEFAULT: string = "USD";
const MARKET_DEFAULT = "parallel";
const FILTER_DEFAULT = "all";
const PAGE_COUNT_MAX = 50;
const MAX_DATE_TIMESTAMP_DIFF = 1 * 60 * 60 * 1000; // I hour diff

@Injectable()
export class CurrencyService {
  constructor(
    @Inject(AuthParserService) private authParser: AuthParserService,
    @Inject(CurrencyPostgresDbService)
    private currencyDb: CurrencyPostgresDbService
  ) {}

  async getCurrencyPairList(
    headers: Headers,
    query: Query
  ): Promise<[number, Response["data"]]> {
    const parsedAuthToken = this.authParser.parseFromHeader(headers);
    const userId = parsedAuthToken.userId;
    const base = query.base ?? BASE_DEFAULT;
    const dateFrom = query.date_from;
    const dateTo = dateFrom
      ? _.clamp(
          query.date_to ?? 0,
          dateFrom,
          dateFrom + MAX_DATE_TIMESTAMP_DIFF
        )
      : undefined;
    const date = query.date ?? "NOW()";
    const market = query.market ?? MARKET_DEFAULT;
    const filter = query.filter ?? FILTER_DEFAULT;
    const includeFavourite = query.include_favourites;
    const pageOffset = query.pagination_offset ?? 0;
    const pageCount = _.clamp(
      query.pagaintion_count ?? PAGE_COUNT_MAX,
      0,
      PAGE_COUNT_MAX
    );
    const total = await this.currencyDb.getCurrenciesTotal();

    let result: {
      data: Response["data"]["currency_pairs"]["data"];
      dates: Response["data"]["currency_pairs"]["dates"];
    } = {
      data: [],
      dates: [],
    };

    if (includeFavourite && userId) {
      const _result: {
        data: { is_starred: boolean; price: number[]; quota: string }[];
        dates: number[];
      } = await this.currencyDb.getCurrencyRatesAtGiveTimeWithFavouritesForUser(
        userId,
        {
          base,
          filter,
          dateFrom,
          dateTo,
          date,
          market,
          pageOffset,
          pageCount,
        }
      );

      result = { ..._result };
    } else if (!includeFavourite) {
      const _result: {
        data: { quota: string; price: number[] }[];
        dates: number[];
      } = await this.currencyDb.getCurrencyRatesAtGiveTimeWithNoFavouritesForUser(
        userId,
        {
          base,
          filter,
          dateFrom,
          dateTo,
          date,
          market,
          pageOffset,
          pageCount,
        }
      );
      result = { ..._result };
    }

    return [
      200,
      {
        currency_pairs: {
          base,
          ...result,
        },
        pagination: {
          total,
          skipped: pageOffset,
          page_count: pageCount,
        },
      },
    ];
  }
}
