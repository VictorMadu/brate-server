import { HttpController, Schema, Send, Body, Headers, Put } from "victormadu-nist-fastify-adapter";
import { Service } from "./set-alert.service";

import { Headers as ReqHeaders, Body as ReqBody, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { ALERT } from "../_constants/routes";

const DEFAULT_MARKET_TYPE = "parallel";

@HttpController(ALERT)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        // response: {
        //   xxx: resxxSchema,
        // },
    })
    @Put()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg] = await this.service.handle({
            authToken: headers.authorization,
            targetRate: body.target_rate,
            marketType: body.market_type ?? DEFAULT_MARKET_TYPE,
            baseCurrency: body.base.toUpperCase(),
            quotaCurrency: body.quota.toUpperCase(),
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
