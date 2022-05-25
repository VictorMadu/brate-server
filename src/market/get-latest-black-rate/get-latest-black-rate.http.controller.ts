import { clamp } from "lodash";
import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { GET_BLACK_LATEST_RATE } from "../_constant/routes";
import { Service } from "./get-latest-black-rate.service";
import { Headers, Query, Res2XX, Res4XX } from "./interface";
import { querystringSchema } from "./schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";

const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const DEFAULT_PAGE_COUNT = 300;
const MAX_PAGE_COUNT = 300;
const DEFAULT_FILTER_TYPE = "all";

@HttpController(GET_BLACK_LATEST_RATE)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    querystring: querystringSchema,
    // response: {
    //   "2xx": res2XXSchema,
    //   "4xx": res4XXSchema,
    // },
  })
  @HttpMethods.Get()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const helper = new Helper(headers, query);
    const [code, msg, payload] = await this.service.handle({
      token: helper.getToken(),
      bases: helper.getBases(),
      pageOffset: helper.getPageOffset(),
      pageCount: helper.getPageCount(),
      filter: helper.getFilter(),
    });

    send<Res2XX | Res4XX>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }
}

class Helper {
  constructor(private headers: Headers, private query: Query) {}

  getPageOffset() {
    return clamp(
      this.query.page_offset ?? DEFAULT_PAGE_OFFSET,
      MIN_PAGE_OFFSET,
      MAX_PAGE_OFFSET
    );
  }

  getPageCount() {
    return clamp(
      this.query.page_count ?? DEFAULT_PAGE_COUNT,
      MIN_PAGE_COUNT,
      MAX_PAGE_COUNT
    );
  }

  getBases() {
    console.log("query bases", this.query);
    return this.query.bases?.split(/,/) ?? [];
  }

  getToken() {
    return this.headers.authorization;
  }

  getFilter() {
    const filter = this.query.filter ?? DEFAULT_FILTER_TYPE;
    if (this.getToken()) return filter;
    return filter === "favourite" ? DEFAULT_FILTER_TYPE : filter;
  }
}
