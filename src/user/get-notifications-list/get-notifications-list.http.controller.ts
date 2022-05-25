import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { clamp } from "lodash";
import { Service } from "./get-notifications-list.service";

import { Headers, Query, Response } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { responseSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { GET_NOTIFICATION_LIST } from "../_constant/routes";

const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const MIN_PAGE_COUNT = 0;
const MAX_PAGE_COUNT = Number.MAX_SAFE_INTEGER;

@HttpController(GET_NOTIFICATION_LIST)
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
    const [code, msg, data] = await this.service.handle({
      authToken: headers.authorization,
      pageCount: clamp(query.page_count || MIN_PAGE_COUNT, MIN_PAGE_COUNT, MAX_PAGE_COUNT),
      pageOffset: clamp(query.page_offset || MIN_PAGE_OFFSET, MIN_PAGE_OFFSET, MAX_PAGE_OFFSET),
      timeFrom: query.from,
      timeTo: query.to,
      type: query.type,
    });

    send<Response>(code, {
      status: code < 300,
      msg,
      data,
    });
  }
}
