import { HttpController, Headers, Post, Schema, Body, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./withdraw-wallet.service";

import { Headers as ReqHeaders, Body as ReqBody, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { WITHDRAW_WALLET } from "../_constant/routes";

@HttpController(WITHDRAW_WALLET)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        // response: {
        //   xxx: resxxSchema,
        // },
    })
    @Post()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg] = await this.service.handle({
            authToken: headers.authorization,
            amountToWithdraw: body.amount,
            currencyToWithdraw: body.currency,
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
