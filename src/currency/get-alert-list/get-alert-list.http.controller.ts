import { HttpController, Get, Schema, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { ALERT } from "../_constants/routes";
import { Service } from "./get-alert-list.service";
import { clamp } from "lodash";

import { Headers as ReqHeaders, Query as ReqQuery, Res2XX, Res4XX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";

const DEFAULT_FILTER = "all";
const DEFAULT_MARKET = "parallel";
const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const DEFAULT_PAGE_COUNT = 30;
const MAX_PAGE_COUNT = 50;

@HttpController(ALERT)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        querystring: querystringSchema,
        // response: {
        //   '2xx': res2XXSchema,
        //   '4xx': res4XXSchema,
        // },
    })
    @Get()
    async route(@Headers() headers: ReqHeaders, @Query() query: ReqQuery, @Send() send: ResSend) {
        const [code, msg, payload] = await this.service.handle({
            authorization: headers.authorization,
            page_count: clamp(
                query.page_count ?? DEFAULT_PAGE_COUNT,
                MIN_PAGE_COUNT,
                MAX_PAGE_COUNT
            ),
            market_type: query.market || DEFAULT_MARKET,
            page_offset: clamp(
                query.page_offset ?? DEFAULT_PAGE_OFFSET,
                MIN_PAGE_OFFSET,
                MAX_PAGE_OFFSET
            ),
            filter: query.filter || DEFAULT_FILTER,
        });

        send<Res2XX | Res4XX>(code, {
            status: code < 300,
            msg,
            data: payload,
        });
    }
}
