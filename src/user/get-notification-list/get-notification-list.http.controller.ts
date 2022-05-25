import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./get-notification-list.service";
import { clamp } from "lodash";

import { Headers, QueryString, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";
import { GET_NOTIFICATION_LIST } from "../_constant/routes";

const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const DEFAULT_PAGE_COUNT = 30;
const MAX_PAGE_COUNT = 50;

@HttpController(GET_NOTIFICATION_LIST)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querystringSchema,
    // response: {
    //   "2xx": res2xxSchema,
    //   "4xx": res4xxSchema,
    // },
  })
  @HttpMethods.Get()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: QueryString,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg, payload] = await this.service.handle({
      authToken: headers.authorization,
      type: query.type,
      pageCount: clamp(
        query.page_count ?? DEFAULT_PAGE_COUNT,
        MIN_PAGE_COUNT,
        MAX_PAGE_COUNT
      ),
      pageOffset: clamp(
        query.page_offset ?? DEFAULT_PAGE_OFFSET,
        MIN_PAGE_OFFSET,
        MAX_PAGE_OFFSET
      ),
      from: query.from,
      to: query.to,
    });

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }
}
