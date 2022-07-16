import { HttpController, Get, Schema, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./get-currencies-amount-list.service";
import { ResSend } from "../../_interfaces";

import { Header as ReqHeaders, Query as ReqQuery, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querySchema } from "./schema/query.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { GET_CURRENCIES_AMOUNT_LIST } from "../_constant/routes";
import { convertObjToArrIfNotArr } from "../../utils/funcs";
import { clamp } from "lodash";

const MIN_PAGE_OFFSET = 0;
const MAX_PAGE_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_PAGE_OFFSET = 0;
const MIN_PAGE_COUNT = 0;
const DEFAULT_PAGE_COUNT = 30;
const MAX_PAGE_COUNT = 50;

// TODO: Use a better route name, just 'wallet' is ok
@HttpController(GET_CURRENCIES_AMOUNT_LIST)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        querystring: querySchema,
        // response: {
        //   "2xx": res2xxSchema,
        //   "4xx": res4xxSchema,
        // },
    })
    @Get()
    async route(@Headers() headers: ReqHeaders, @Query() query: ReqQuery, @Send() send: ResSend) {
        const [code, msg, data] = await this.service.handle({
            authToken: headers.authorization,
            currencies: convertObjToArrIfNotArr(query.currencies),
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
            data,
        });
    }
}
