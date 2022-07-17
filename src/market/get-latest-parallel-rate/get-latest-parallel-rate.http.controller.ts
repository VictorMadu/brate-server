import { HttpController, Schema, Get, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { clamp } from "lodash";
import { GET_PARALLEL_LATEST_RATE } from "../_constant/routes";
import { Service } from "./get-latest-parallel-rate.service";
import { Headers as ReqHeaders, Query as ReqQuery, Res2XX, Res4XX } from "./interface";
import { querystringSchema } from "./schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";

const DEFAULT_BASE = "USD";
const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const DEFAULT_PAGE_COUNT = 300;
const MAX_PAGE_COUNT = 300;
const DEFAULT_FILTER_TYPE = "all";

// TODO: Split this into router for black and parallel rate
@HttpController(GET_PARALLEL_LATEST_RATE)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        querystring: querystringSchema,
        // response: {
        //   "2xx": res2XXSchema,
        //   "4xx": res4XXSchema,
        // },
    })
    @Get()
    async route(@Headers() headers: ReqHeaders, @Query() query: ReqQuery, @Send() send: ResSend) {
        const helper = new Helper(headers, query);
        const [code, msg, payload] = await this.service.handle({
            token: helper.getToken(),
            base: helper.getBase(),
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
    constructor(private headers: ReqHeaders, private query: ReqQuery) {}

    getPageOffset() {
        return clamp(
            this.query.page_offset ?? DEFAULT_PAGE_OFFSET,
            MIN_PAGE_OFFSET,
            MAX_PAGE_OFFSET
        );
    }

    getPageCount() {
        return clamp(this.query.page_count ?? DEFAULT_PAGE_COUNT, MIN_PAGE_COUNT, MAX_PAGE_COUNT);
    }

    getBase() {
        return this.query.base ?? DEFAULT_BASE;
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
