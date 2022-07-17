import { HttpController, Schema, Get, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { clamp } from "lodash";
import { Service } from "./trade-list.service";
import { Query as ReqQuery, Res2xx, Res4xx } from "./interface";
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

    @Schema({
        querystring: querystringSchema,
        // response: {
        //   '2xx': res2XXSchema,
        //   '4xx': res4XXSchema,
        // },
    })
    @Get()
    async route(@Query() query: ReqQuery, @Send() send: ResSend) {
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
