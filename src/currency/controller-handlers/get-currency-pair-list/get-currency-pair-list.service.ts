import { Headers, Query, Response, In_Data, ResTuple } from "./interface";
import { clamp } from "lodash";
import { GetCurrencyPairListDbService } from "./get-currency-pair-list.db";
import { Injectable } from "nist-core/injectables";
import { AuthParserService } from "../../../utils/auth-manager.service";

const DEFAULT_BASE: string = "USD";
const DEFAULT_MARKET = "parallel";
const MIN_INTERVAL = 1 * 24 * 60 * 60; // 1 day interval
const MAX_INTERVAL = 365 * 24 * 60 * 60; // 1 YEAR interval
const DEFAULT_STEPS = 1;
const MAX_STEPS = 50;
const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = 300;
const MIN_PAGE_LIMIT = 1;
const MAX_PAGE_LIMIT = 300;

@Injectable()
export class Service {
  constructor(
    private dbService: GetCurrencyPairListDbService,
    private authParser: AuthParserService
  ) {}

  async handle(headers: Headers, query: Query): Promise<ResTuple> {
    const results = await this.getResults(query);

    return [
      200,
      "",
      {
        currency_pairs: {
          base: this.getBase(query),
          favourites: (await this.getFavourites(headers)) ?? [],
          data: results,
        },
        pagination: {
          page_count: this.getLimit(query),
          skipped: this.getOffset(query),
        },
      },
    ];
  }

  private async getFavourites(headers: Headers) {
    const { userId } = this.authParser.parseFromHeader(headers);
    return userId ? await this.dbService.getFavourites(userId) : [];
  }

  private async getResults(query: Query) {
    return await this.dbService.getCurrenciesRatesFromMarket(
      query.market || DEFAULT_MARKET,
      this.getDataForDb(query)
    );
  }

  private convertNumToTnt(float_num: number) {
    return Math.round(float_num);
  }

  private getCurrentTimestamp() {
    const timestamp = new Date().getTime() / 1000;
    return this.convertNumToTnt(timestamp);
  }

  private getDataForDb(query: Query): In_Data {
    const interval = this.getInterval(query);
    const steps = this.getSteps(query);
    const from = this.getFrom(query);
    return {
      base: this.getBase(query),
      interval,
      from,
      offset: this.getOffset(query),
      limit: this.getLimit(query),
      to: from + steps * interval,
    };
  }

  private getOffset(query: Query) {
    const offset = this.convertNumToTnt(query.page_offset || MIN_PAGE_OFFSET);
    return clamp(offset, MIN_PAGE_OFFSET, MAX_PAGE_OFFSET);
  }

  private getLimit(query: Query) {
    const limit = this.convertNumToTnt(query.page_count || MIN_PAGE_LIMIT);
    return clamp(limit, MIN_PAGE_LIMIT, MAX_PAGE_LIMIT);
  }

  private getSteps(query: Query) {
    const steps = this.convertNumToTnt(query.steps || DEFAULT_STEPS);
    return clamp(steps, -MAX_STEPS, MAX_STEPS);
  }

  private getFrom(query: Query) {
    return query.from || this.getCurrentTimestamp();
  }

  private getBase(query: Query) {
    return query.base || DEFAULT_BASE;
  }

  private getInterval(query: Query) {
    const interval = this.convertNumToTnt(query.interval || MIN_INTERVAL);
    return clamp(interval, MIN_INTERVAL, MAX_INTERVAL);
  }
}
