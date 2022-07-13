import { HttpController, Schema, Put, Send, Params } from "victormadu-nist-fastify-adapter";
import { Service } from "./send-one-time-pwd.service";
import { ResSend } from "../../_interfaces";

import { Params as ReqParams, ResXXX } from "./interface";
import { paramsSchema } from "./schema/param.schema";
import { resxxxSchema } from "./schema/response.schema";
import { SEND_OTP } from "../_constant/routes";

@HttpController(SEND_OTP)
export class Controller {
    constructor(private service: Service) {}

    @Schema({
        params: paramsSchema,
        response: {
            xxx: resxxxSchema,
        },
    })
    @Put("/:email")
    async route(@Send() send: ResSend, @Params() params: ReqParams) {
        const [code, msg] = await this.service.handle({
            email: params.email,
        });

        send<ResXXX>(code, {
            status: code < 300,
            msg,
        });
    }
}
