import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { ALERT_LIST } from "../_constants/routes";
import { Service } from "./get-alert-list.service";
import { clamp } from "lodash";

import { Headers, Query, Response } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { responseSchema } from "./schema/response.schema";
import { ResSend } from "../../../_interfaces";

const DEFAULT_FILTER = "all";
const DEFAULT_MARKET = "parallel";
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const MAX_PAGE_COUNT = 50;

@HttpController(ALERT_LIST)
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
    const [code, msg, payload] = await this.service.handle({
      authorization: headers.authorization,
      page_count: clamp(query.page_count || MIN_PAGE_COUNT, MIN_PAGE_COUNT, MAX_PAGE_COUNT),
      market_type: query.market || DEFAULT_MARKET,
      page_offset: query.page_offset || DEFAULT_PAGE_OFFSET,
      filter: query.filter || DEFAULT_FILTER,
    });

    send<Response>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }
}
