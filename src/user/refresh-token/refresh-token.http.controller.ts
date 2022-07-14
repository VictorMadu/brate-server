import { HttpController, Schema, Post, Send, Headers } from "victormadu-nist-fastify-adapter";
import { Service } from "./refresh-token.service";
import { ResSend } from "../../_interfaces";

import { Headers as ReqHeaders, Res2xx, Res4xx } from "./interface";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { REFRESH_TOKEN } from "../_constant/routes";
import { headerSchema } from "./schema/header.schema";

const DEFAULT_INCLUDE_TOKEN = false;

@HttpController(REFRESH_TOKEN)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        // response: {
        //   '2xx': res2xxSchema,
        //   '4xx': res4xxSchema
        // }
    })
    @Post()
    async route(@Send() send: ResSend, @Headers() headers: ReqHeaders) {
        const [code, msg, data] = await this.service.handle({
            authToken: headers.authorization,
        });

        send<Res2xx | Res4xx>(code, {
            status: code < 300,
            msg,
            data,
        });
    }
}
