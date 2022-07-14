import { HttpController, Schema, Post, Send, Body } from "victormadu-nist-fastify-adapter";
import { Service } from "./sign-in.service";
import { ResSend } from "../../_interfaces";

import { Body as ReqBody, Res2xx, Res4xx } from "./interface";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { SIGN_IN } from "../_constant/routes";
import { bodySchema } from "./schema/body.schema";

@HttpController(SIGN_IN)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        body: bodySchema,
        // response: {
        //   '2xx': res2xxSchema,
        //   '4xx': res4xxSchema
        // }
    })
    @Post()
    async route(@Send() send: ResSend, @Body() body: ReqBody) {
        const [code, msg, data] = await this.service.handle({
            email: body.email,
            password: body.password,
        });

        send<Res2xx | Res4xx>(code, {
            status: code < 300,
            msg,
            data,
        });
    }
}
