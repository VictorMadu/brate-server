import { HttpController, Get, Schema, Headers, Query, Send } from "victormadu-nist-fastify-adapter";
import { Service } from "./get-user-data.service";

import { Headers as ReqHeaders, Query as ReqQuery, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { GET_USER_DATA } from "../_constant/routes";

@HttpController(GET_USER_DATA)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        // TODO: Comment this because user will pass can booleans in form of string
        // querystring: querystringSchema,
        // response: {
        //   "2xx": res2xxSchema,
        //   "4xx": res4xxSchema,
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
        if (this.queryHaveNoInclude(query)) {
            return {
                includeEmail: true,
                includePhone: true,
                includeName: true,
            };
        }
        return {
            includeEmail: this.isTruish(query.include_email),
            includePhone: this.isTruish(query.include_phone),
            includeName: this.isTruish(query.include_name),
        };
    }

    private isTruish(obj?: any) {
        return obj === true || (<string>obj?.toString())?.toLowerCase() === "true";
    }

    private queryHaveNoInclude(query: ReqQuery) {
        return (
            query.include_email == null && query.include_name == null && query.include_phone == null
        );
    }
}
