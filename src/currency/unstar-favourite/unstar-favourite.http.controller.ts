import {
    HttpController,
    Schema,
    Delete,
    Headers,
    Body,
    Send,
} from "victormadu-nist-fastify-adapter";
import { ResSend } from "../../_interfaces";

import { STAR_FAVOURITE } from "../_constants/routes";
import { Service } from "./unstar-favourite.service";

import { Body as ReqBody, Headers as ReqHeaders, Res2XX, Res4XX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";

// TODO: Take currencyPairs as query instead of body data
@HttpController(STAR_FAVOURITE)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        headers: headerSchema,
        body: bodySchema,
        // response: {
        //   "2xx": res2XXSchema,
        //   "4xx": res4XXSchema,
        // },
    })
    @Delete()
    async route(@Headers() headers: ReqHeaders, @Body() body: ReqBody, @Send() send: ResSend) {
        const [code, msg, payload] = await this.service.handle({
            authToken: headers.authorization,
            currency_pairs: body.currency_pairs,
        });

        send<Res2XX | Res4XX>(code, {
            status: code < 300,
            msg,
            data: payload,
        });
    }

    getItemAsArr<T extends unknown>(obj: T | T[]): T[] {
        if (Array.isArray(obj)) return obj;
        return [obj];
    }
}
