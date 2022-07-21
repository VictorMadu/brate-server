import { ResSend } from "../../_interfaces";
import {
    HttpController,
    Schema,
    Delete,
    Headers,
    Body,
    Send,
} from "victormadu-nist-fastify-adapter";
import { ALERT } from "../_constants/routes";
import { Service } from "./delete-alert-list.service";

import { Body as ReqBody, Headers as ReqHeaders, Res2XX, Res4XX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";

@HttpController(ALERT)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        // response: {
        //   '2xx': res2XXSchema,
        //   '4xx': res4XXSchema,
        // },
    })
    @Delete()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg, payload] = await this.service.handle({
            authorization: headers.authorization,
            ids: body.ids,
        });

        send<Res2XX | Res4XX>(code, {
            status: code < 300,
            msg,
            data: payload,
        });
    }
}
