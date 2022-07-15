import {
    HttpController,
    Get,
    Schema,
    Headers,
    Req,
    Post,
    Send,
} from "victormadu-nist-fastify-adapter";
import { Service } from "./get-ws-ticket.service";

import { Headers as ReqHeaders, Resxx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { resxxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { GET_WS_TICKET } from "../_constant/routes";
import { FastifyRequest } from "fastify";

@HttpController(GET_WS_TICKET)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        // response: {
        //   xxx: resxxxSchema
        // },
    })
    @Post()
    async route(@Headers() headers: ReqHeaders, @Send() send: ResSend, @Req() rep: FastifyRequest) {
        const [code, msg] = await this.service.handle({
            authToken: headers.authorization,
            ip: rep.socket.remoteAddress,
        });

        send<Resxx>(code, {
            status: code < 300,
            msg,
        });
    }
}
