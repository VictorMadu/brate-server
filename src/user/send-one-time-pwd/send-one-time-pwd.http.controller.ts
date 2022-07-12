import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./send-one-time-pwd.service";
import { ResSend } from "../../_interfaces";

import { Params, ResXXX } from "./interface";
import { paramsSchema } from "./schema/param.schema";
import { resxxxSchema } from "./schema/response.schema";
import { SEND_OTP } from "../_constant/routes";

@HttpController(SEND_OTP)
export class Controller {
    constructor(private service: Service) {}

    @HttpMethods.Schema({
        params: paramsSchema,
        response: {
            xxx: resxxxSchema,
        },
    })
    @HttpMethods.Post("/:email")
    async route(
        @HttpParams.Send() send: ResSend,
        @HttpParams.Params() params: Params
    ) {
        const [code, msg] = await this.service.handle({
            email: params.email,
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
