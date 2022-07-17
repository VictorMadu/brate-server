import { clamp } from "lodash";
import { HttpController, Schema, Get, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { GET_CURRENCY_RATE } from "../_constant/routes";
import { Service } from "./get-currency-rate-and-data.service";
import { Headers as ReqHeaders, Query as ReqQuery, Res2XX, Res4XX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";

const DEFAULT_BASE: string = "USD";
const DEFAULT_MARKET = "parallel";
const DEFAULT_INCLUDE_FAVOURITES = false;
const MIN_INTERVAL = 1; // 1 sec interval
const MAX_INTERVAL = 365 * 24 * 60 * 60; // 1 YEAR interval
const DEFAULT_STEPS = 1;
const MAX_STEPS = 500;
const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const DEFAULT_PAGE_COUNT = 30;
const MAX_PAGE_COUNT = 50;

@HttpController(GET_CURRENCY_RATE)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
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
            authToken: helper.getAuthToken(),
            base: helper.getBase(),
            quotas: helper.getQuotas(),
            from: helper.getFrom(),
            include_favourites: helper.getIncludeFavourites(),
            market_type: helper.getMarket(),
            steps: helper.getSteps(),
            interval: helper.getInterval(),
            page_offset: helper.getPageOffset(),
            page_count: helper.getPageCount(),
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
        return clamp(
            this.query.page_offset ?? DEFAULT_PAGE_OFFSET,
            MIN_PAGE_OFFSET,
            MAX_PAGE_OFFSET
        );
    }

    getPageCount() {
        return clamp(this.query.page_count ?? DEFAULT_PAGE_COUNT, MIN_PAGE_COUNT, MAX_PAGE_COUNT);
    }

    getSteps() {
        return clamp(this.query.steps ?? DEFAULT_STEPS, -MAX_STEPS, MAX_STEPS);
    }

    getFrom() {
        return this.query.from || this.getCurrentTimestamp();
    }

    getBase() {
        return this.query.base || DEFAULT_BASE;
    }

    getQuotas() {
        return this.query.quotas || [];
    }

    getInterval() {
        return clamp(this.query.interval ?? MIN_INTERVAL, MIN_INTERVAL, MAX_INTERVAL);
    }

    private getCurrentTimestamp() {
        return new Date().getTime() / 1000;
    }
}
