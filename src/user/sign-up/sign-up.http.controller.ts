import { HttpController, Post, Schema, Body, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./sign-up.service";
import { ResSend } from "../../_interfaces";

import { Body as ReqBody, ResXXX } from "./interface";
import { bodySchema } from "./schema/body.schema";
import { resxxxSchema } from "./schema/response.schema";
import { SIGN_UP } from "../_constant/routes";

@HttpController(SIGN_UP)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        body: bodySchema,
        response: {
            xxx: resxxxSchema,
        },
    })
    @Post()
    async route(@Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg] = await this.service.handle({
            name: body.name,
            email: body.email,
            phone: body.phone,
            password: body.password,
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
