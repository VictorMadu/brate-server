import { clamp } from "lodash";
import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { CURRENCY_PAIR_LIST } from "../_constants/routes";
import { Service } from "./get-currency-pair-list.service";
import { Headers, Query, Response } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { responseSchema } from "./schema/response.schema";
import { ResSend } from "../../../_interfaces";

const DEFAULT_BASE: string = "USD";
const DEFAULT_MARKET = "parallel";
const DEFAULT_INCLUDE_FAVOURITES = false;
const MIN_INTERVAL = 1 * 24 * 60 * 60; // 1 day interval
const MAX_INTERVAL = 365 * 24 * 60 * 60; // 1 YEAR interval
const DEFAULT_STEPS = 1;
const MAX_STEPS = 50;
const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = 300;
const MIN_PAGE_LIMIT = 1;
const MAX_PAGE_LIMIT = 300;

@HttpController(CURRENCY_PAIR_LIST)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querystringSchema,
    response: responseSchema,
  })
  @HttpMethods.Get()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const helper = new Helper(headers, query);
    const [code, msg, payload] = await this.service.handle({
      authToken: helper.getAuthToken(),
      base: helper.getBase(),
      from: helper.getFrom(),
      include_favourites: helper.getIncludeFavourites(),
      market_type: helper.getMarket(),
      steps: helper.getSteps(),
      interval: helper.getInterval(),
      page_offset: helper.getPageOffset(),
      page_count: helper.getPageCount(),
    });

    send<Response>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }
}

class Helper {
  constructor(private headers: Headers, private query: Query) {}

  getIncludeFavourites() {
    return this.query.include_favourites ?? DEFAULT_INCLUDE_FAVOURITES;
  }

  getMarket() {
    return this.query.market ?? DEFAULT_MARKET;
  }

  getAuthToken() {
    return this.headers.authorization;
  }

  getPageOffset() {
    const offset = this.convertNumToTnt(this.query.page_offset || MIN_PAGE_OFFSET);
    return clamp(offset, MIN_PAGE_OFFSET, MAX_PAGE_OFFSET);
  }

  getPageCount() {
    const limit = this.convertNumToTnt(this.query.page_count || MIN_PAGE_LIMIT);
    return clamp(limit, MIN_PAGE_LIMIT, MAX_PAGE_LIMIT);
  }

  getSteps() {
    const steps = this.convertNumToTnt(this.query.steps || DEFAULT_STEPS);
    return clamp(steps, -MAX_STEPS, MAX_STEPS);
  }

  getFrom() {
    return this.query.from || this.getCurrentTimestamp();
  }

  getBase() {
    return this.query.base || DEFAULT_BASE;
  }

  getInterval() {
    const interval = this.convertNumToTnt(this.query.interval || MIN_INTERVAL);
    return clamp(interval, MIN_INTERVAL, MAX_INTERVAL);
  }

  private convertNumToTnt(float_num: number) {
    return Math.round(float_num);
  }

  private getCurrentTimestamp() {
    const timestamp = new Date().getTime() / 1000;
    return this.convertNumToTnt(timestamp);
  }
}
