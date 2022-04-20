import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./verify-otp.service";
import { ResSend } from "../../_interfaces";

import { Body, Params, Response } from "./interface";
import { paramsSchema } from "./schema/param.schema";
import { responseSchema } from "./schema/response.schema";
import { VERFIY_OTP } from "../_constant/routes";
import { bodySchema } from "./schema/body.schema";

const DEFAULT_INCLUDE_TOKEN = false;

@HttpController(VERFIY_OTP)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    params: paramsSchema,
    body: bodySchema,
    response: responseSchema,
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

    send<Response>(code, {
      status: code < 300,
      msg,
      data,
    });
  }
}
