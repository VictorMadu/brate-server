import { HttpController, Headers, Post, Schema, Body, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./set-black-rate.service";

import { Headers as ReqHeaders, Body as ReqBody, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resxxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { SET_BLACK_RATE } from "../_constant/routes";

@HttpController(SET_BLACK_RATE)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        // response: {
        //   xxx: resxxxSchema,
        // },
    })
    @Post()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg] = await this.service.handle({
            authToken: headers.authorization,
            rate: body.rate,
            baseCurrency: body.base,
            quotaCurrency: body.quota,
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
