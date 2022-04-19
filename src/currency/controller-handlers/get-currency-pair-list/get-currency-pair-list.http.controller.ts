import { ResSend } from "currency/controller-handlers/_interfaces";
import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { CURRENCY_PAIR_LIST } from "../_constants/routes";
import { Service } from "./get-currency-pair-list.service";
import { Headers, Query, Response } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { responseSchema } from "./schema/response.schema";

@HttpController(CURRENCY_PAIR_LIST)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querystringSchema,
    response: responseSchema,
  })
  @HttpMethods.Get()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg, payload] = await this.service.handle(headers, query);

    send<Response>(code, {
      status: true,
      msg,
      data: payload,
    });
  }
}
