import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./set-alert.service";

import { Headers, Body, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { ALERT } from "../_constants/routes";

const DEFAULT_MARKET_TYPE = "parallel";

@HttpController(ALERT)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    body: bodySchema,
    // response: {
    //   xxx: resxxSchema,
    // },
  })
  @HttpMethods.Put()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Body() body: Body,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg] = await this.service.handle({
      authToken: headers.authorization,
      targetRate: body.target_rate,
      marketType: body.market_type ?? DEFAULT_MARKET_TYPE,
      baseCurrency: body.base,
      quotaCurrency: body.quota,
    });

    send<ResXXX>(code, {
      status: code < 300,
      msg,
    });
  }
}
