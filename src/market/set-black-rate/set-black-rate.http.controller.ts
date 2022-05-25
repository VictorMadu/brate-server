import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./set-black-rate.service";

import { Headers, Body, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resxxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { SET_BLACK_RATE } from "../_constant/routes";

@HttpController(SET_BLACK_RATE)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    body: bodySchema,
    // response: {
    //   xxx: resxxxSchema,
    // },
  })
  @HttpMethods.Post()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Body() body: Body,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg] = await this.service.handle({
      authToken: headers.authorization,
      rate: body.rate,
      baseCurrency: body.base,
      quotaCurrency: body.quota,
    });

    send<ResXXX>(code, {
      status: code < 300,
      msg,
    });
  }
}
