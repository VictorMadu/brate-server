import { AuthParser, Db, DbCon, Headers, Query, Response, ServiceResult } from "./interface";
import { clamp } from "lodash";
import { TIMESTAMP_NULL } from "./constants";
import { GetCurrencyPairListDb } from "./get-currency-pair-list.db";

const DEFAULT_BASE: string = "USD";
const DEFAULT_MARKET = "parallel";
const DEFAULT_FILTER = "all";
const DEFAULT_PAGE_OFFSET = 0;
const PAGE_COUNT_MAX = 50;
const MAX_DATE_TIMESTAMP_DIFF = 48 * 60 * 60 * 1000; // 48 hours diff

class GetCurrencyPairListService {
  private headers!: Headers;
  private query!: Query;
  private db: Db;
  constructor(private authParser: AuthParser, dbCon: DbCon) {
    this.db = new GetCurrencyPairListDb(dbCon);
  }

  async handle(headers: Headers, query: Query): Promise<[number, Response["data"]]> {
    this.setHeadersAndQueryCtx(headers, query);
    const { userId } = this.authParser.parseFromHeader(this.headers);
    const favourites = userId ? await this.getFavourites(userId) : [];
    const results = this.db.getNamesAndRates({
      userId,
      base: this.getBase(),
      filter: this.getFilter(),
      dateFrom: this.getDateFrom(),
      dateTo: this.getDateTo(),
      date: this.getDate(),
      market: this.getMarket(),
      pageOffset: this.getPageOffset(),
      pageCount: this.getPageCount(),
    });
    return [
      200,
      {
        currency_pairs: {
          base: this.getBase(),
          ...(await this.getResult()),
        },
        pagination: {
          total: await this.db.getTotal(),
          skipped: this.getPageOffset(),
          page_count: this.getPageCount(),
        },
      },
    ];
  }

  private async getFavourites(userId: string) {
    return await this.db.getFavourites(userId);
  }

  private async getResult(): Promise<ServiceResult> {
    const payload = this.getDbPayload();
    const DEFAULT: ServiceResult = {
      data: [],
      dates: [],
    };

    return this.isIncludeFavouriteAndAuthenticatedUser()
      ? await this.db.getRateAtGivenTimeWithFavourite(payload)
      : !this.shouldIncludeFavourite()
      ? await this.db.getRateAtGivenTimeWithoutFavourite(payload)
      : DEFAULT;
  }

  private setHeadersAndQueryCtx(headers: Headers, query: Query) {
    this.headers = headers;
    this.query = query;
  }

  private getUserId() {
    const parsedAuthToken = this.authParser.parseFromHeader(this.headers);
    return parsedAuthToken.userId;
  }
  private getBase() {
    return this.query.base ?? DEFAULT_BASE;
  }

  private getDateFrom() {
    return this.query.date_from;
  }

  private getDateTo() {
    const dateForm = this.getDateFrom();
    return dateForm
      ? clamp(this.query.date_to ?? 0, dateForm, dateForm + MAX_DATE_TIMESTAMP_DIFF)
      : undefined;
  }

  private getDate() {
    return this.query.date ?? TIMESTAMP_NULL;
  }

  private getMarket() {
    return this.query.market ?? DEFAULT_MARKET;
  }

  private getFilter() {
    return this.query.filter ?? DEFAULT_FILTER;
  }

  private shouldIncludeFavourite() {
    return this.query.include_favourites;
  }

  private getPageOffset() {
    return this.query.pagination_offset ?? DEFAULT_PAGE_OFFSET;
  }

  private getPageCount() {
    return clamp(this.query.pagaintion_count ?? PAGE_COUNT_MAX, 0, PAGE_COUNT_MAX);
  }

  private isIncludeFavouriteAndAuthenticatedUser() {
    return this.shouldIncludeFavourite() && this.getUserId();
  }

  private getDbPayload() {
    return {
      userId: this.getUserId(),
      base: this.getBase(),
      filter: this.getFilter(),
      dateFrom: this.getDateFrom(),
      dateTo: this.getDateTo(),
      date: this.getDate(),
      market: this.getMarket(),
      pageOffset: this.getPageOffset(),
      pageCount: this.getPageCount(),
    };
  }
}
