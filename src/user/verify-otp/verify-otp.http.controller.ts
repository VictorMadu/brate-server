import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./verify-otp.service";
import { ResSend } from "../../_interfaces";

import { Body, Params, Res2xx, Res4xx } from "./interface";
import { paramsSchema } from "./schema/param.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { VERFIY_OTP } from "../_constant/routes";
import { bodySchema } from "./schema/body.schema";

const DEFAULT_INCLUDE_TOKEN = false;

@HttpController(VERFIY_OTP)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    params: paramsSchema,
    body: bodySchema,
    response: {
      "2xx": res2xxSchema,
      // "4xx": res4xxSchema,
    },
  })
  @HttpMethods.Post("/:email")
  async route(
    @HttpParams.Send() send: ResSend,
    @HttpParams.Params() params: Params,
    @HttpParams.Body() body: Body
  ) {
    const [code, msg, data] = await this.service.handle({
      email: params.email,
      otp: body.otp,
      includeToken: body.include_token ?? DEFAULT_INCLUDE_TOKEN,
    });

    return send<Res2xx | Res4xx>(code, {
      status: code < 400,
      msg,
      data,
    });
  }
}
