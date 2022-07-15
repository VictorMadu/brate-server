import { HttpController, Schema, Post, Headers, Body, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./edit-user-web-data.service";

import { Headers as ReqHeaders, Body as ReqBody, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { EDIT_USER_WEB_DATA } from "../_constant/routes";

@HttpController(EDIT_USER_WEB_DATA)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        // response: {
        //   "2xx": res2xxSchema,
        //   "4xx": res4xxSchema,
        // },
    })
    @Post()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg] = await this.service.handle({
            authToken: headers.authorization,
            language: body.language,
            // TODO: The update time is in seconds. Pls rename all variables down to the db to indicate that it is in seconds. I got confused and forgot whether this is in ms or secs. Also rememeber general app re-structuring
            remove_trade_notification_after: body.remove_trade_notification_after,
            remove_price_alert_notification_after: body.remove_price_alert_notification_after,
            remove_fund_notification_after: body.remove_fund_notification_after,
            bereau_de_change: body.bereau_de_change,
            dark_mode: body.dark_mode,
        });

        send<Res2xx | Res4xx>(code, {
            status: code < 300,
            msg,
        });
    }
}
