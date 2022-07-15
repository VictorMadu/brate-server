import { HttpController, Get, Schema, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./get-notification-list.service";
import { clamp } from "lodash";
import { Headers as ReqHeaders, QueryString as ReqQuery, Res2xx, Res4xx } from "./interface";
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

    @Schema({
        headers: headerSchema,
        // TODO: We commented out queryString for the reason in the next TODO
        // querystring: querystringSchema,
        // response: {
        //   "2xx": res2xxSchema,
        //   "4xx": res4xxSchema,
        // },
    })
    @Get()
    // TODO: Remove Schema and validate data ourselves. User may want to test route using Postman which will see number and boolean as string. When we are validating and sanitizing, we will try to convert fields that are suppose to be like say: number or boolean to their respectively values. If they fail them we throw error

    // TODO: Rename "created at" of "notifications" reponsse to "created_at"
    async route(@Headers() headers: ReqHeaders, @Query() query: ReqQuery, @Send() send: ResSend) {
        const [code, msg, payload] = await this.service.handle({
            authToken: headers.authorization,
            type: query.type,
            pageCount: clamp(
                parseInt(<any>query.page_count) ?? DEFAULT_PAGE_COUNT,
                MIN_PAGE_COUNT,
                MAX_PAGE_COUNT
            ),
            pageOffset: clamp(
                parseInt(<any>query.page_offset) ?? DEFAULT_PAGE_OFFSET,
                MIN_PAGE_OFFSET,
                MAX_PAGE_OFFSET
            ),
            from: query.from ? parseInt(<any>query.from) : query.from,
            to: query.to ? parseInt(<any>query.to) : query.to,
        });

        send<Res2xx | Res4xx>(code, {
            status: code < 300,
            msg,
            data: payload,
        });
    }
}
