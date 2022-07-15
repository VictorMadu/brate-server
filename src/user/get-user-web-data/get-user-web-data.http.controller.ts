import { HttpController, Get, Schema, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./get-user-web-data.service";

import { Headers as ReqHeaders, Query as ReqQuery, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { GET_USER_WEB_DATA } from "../_constant/routes";

@HttpController(GET_USER_WEB_DATA)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        // querystring: querystringSchema,
        // response: {
        //   '2xx': res2xxSchema,
        //   '4xx': res4xxSchema,
        // },
    })
    @Get()
    async route(@Headers() headers: ReqHeaders, @Query() query: ReqQuery, @Send() send: ResSend) {
        const [code, msg, data] = await this.service.handle({
            authToken: headers.authorization,
            ...this.getIncludeObj(query),
        });

        send<Res2xx | Res4xx>(code, {
            status: code < 300,
            msg,
            data,
        });
    }

    private getIncludeObj(query: ReqQuery) {
        if (this.isAllNull(query)) {
            return {
                include_web_client_id: true,
                include_language: true,
                include_remove_trade_notification_after: true,
                include_remove_price_alert_notification_after: true,
                include_remove_fund_notification_after: true,
                include_bereau_de_change: true,
                include_dark_mode: true,
            };
        }
        return {
            include_web_client_id: this.isTruish(query.include_web_client_id),
            include_language: this.isTruish(query.include_language),
            include_remove_trade_notification_after: this.isTruish(
                query.include_remove_trade_notification_after
            ),
            include_remove_price_alert_notification_after: this.isTruish(
                query.include_remove_price_alert_notification_after
            ),
            include_remove_fund_notification_after: this.isTruish(
                query.include_remove_fund_notification_after
            ),
            include_bereau_de_change: this.isTruish(query.include_bereau_de_change),
            include_dark_mode: this.isTruish(query.include_dark_mode),
        };
    }

    private isAllNull(query: ReqQuery) {
        const allData = [
            query.include_web_client_id,
            query.include_language,
            query.include_remove_trade_notification_after,
            query.include_remove_price_alert_notification_after,
            query.include_remove_fund_notification_after,
            query.include_bereau_de_change,
            query.include_dark_mode,
        ];

        for (let i = 0; i < allData.length; i++) {
            if (allData[i] != null) return;
        }
        return true;
    }

    private isTruish(obj?: any) {
        return obj === true || (<string>obj?.toString())?.toLowerCase() === "true";
    }
}
