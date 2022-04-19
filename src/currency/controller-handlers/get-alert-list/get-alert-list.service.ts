import { clamp } from "lodash";
import { Injectable } from "nist-core/injectables";
import { InnerValue } from "ts-util-types";
import { AuthParserService } from "../../../utils/auth-manager.service";
import { GetAlertListDbService } from "./get-alert-list.db";
import { Headers, Query, Response } from "./interface";

const DEFAULT_FILTER = "all";
const DEFAULT_MARKET = "parallel";
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const MAX_PAGE_COUNT = 50;

type C = InnerValue<Response, "data">;
@Injectable()
export class Service {
  constructor(private dbService: GetAlertListDbService, private authParser: AuthParserService) {}

  async handle(
    headers: Headers,
    query: Query
  ): Promise<[number, string, Response["data"] | undefined]> {
    const userId = this.authParser.parseFromHeader(headers).userId;
    if (!userId) return [401, "", undefined];

    const offset = this.getPageOffset(query);
    const limit = this.getPageCount(query);

    const result = await this.dbService.getPriceAlerts({
      userId,
      filter: this.getFilter(query),
      market_type: this.getMarketType(query),
      offset,
      limit,
    });

    return [
      200,
      "",
      {
        alerts: result,
        pagination: {
          skipped: offset,
          page_count: result.length,
        },
      },
    ];
  }

  getFilter(query: Query) {
    return query.filter || DEFAULT_FILTER;
  }

  getMarketType(query: Query) {
    return query.market || DEFAULT_MARKET;
  }

  getPageOffset(query: Query) {
    return query.page_offset || DEFAULT_PAGE_OFFSET;
  }

  getPageCount(query: Query) {
    return clamp(query.page_count || MIN_PAGE_COUNT, MIN_PAGE_COUNT, MAX_PAGE_COUNT);
  }
}
