import { HttpController, Schema, Headers, Body, Send, Post } from "victormadu-nist-fastify-adapter";
import { Service } from "./edit-user-data.service";

import { Headers as ReqHeaders, Body as ReqBody, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { EDIT_USER_DATA } from "../_constant/routes";

// TODO: Change route and method to suit editing of user data better. Using PATCH method and a /user
@HttpController(EDIT_USER_DATA)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        response: { xxx: resxxSchema },
    })
    @Post()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg] = await this.service.handle({
            authToken: headers.authorization,
            phone: body.phone,
            name: body.name,
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
