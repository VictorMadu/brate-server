import { HttpController, Schema, Post, Headers, Body, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./trade-exchange.service";

import { TRADE_EXCHANGE_ROUTE } from "../_constant/routes";
import { Headers as ReqHeaders, Body as ReqBody, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resXXXSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";

@HttpController(TRADE_EXCHANGE_ROUTE)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        response: {
            xxx: resXXXSchema,
        },
    })
    @Post()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg] = await this.service.handle({
            authToken: headers.authorization,
            currencySend: body.currency_send,
            currencyReceive: body.currency_receive,
            amountSend: body.amount_send,
            sellerId: body.seller_id,
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
