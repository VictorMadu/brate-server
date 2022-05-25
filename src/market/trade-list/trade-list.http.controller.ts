import { clamp } from "lodash";
import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./trade-list.service";
import { Query, Res2xx, Res4xx } from "./interface";
import { querystringSchema } from "./schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";
import { TRADE_LIST_ROUTE } from "../_constant/routes";
import { convertObjToArrIfNotArr } from "../../utils/funcs";

const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const DEFAULT_PAGE_COUNT = 30;
const MAX_PAGE_COUNT = 50;

@HttpController(TRADE_LIST_ROUTE)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    querystring: querystringSchema,
    // response: {
    //   '2xx': res2XXSchema,
    //   '4xx': res4XXSchema,
    // },
  })
  @HttpMethods.Get()
  async route(
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg, payload] = await this.service.handle({
      pairs: convertObjToArrIfNotArr(query.pairs),
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
    });

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }
}
