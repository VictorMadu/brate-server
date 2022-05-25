import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./trade-exchange.service";

import { TRADE_EXCHANGE_ROUTE } from "../_constant/routes";
import { Headers, Body, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resXXXSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";

@HttpController(TRADE_EXCHANGE_ROUTE)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    body: bodySchema,
    response: {
      xxx: resXXXSchema,
    },
  })
  @HttpMethods.Post()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Body() body: Body,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg] = await this.service.handle({
      authToken: headers.authorization,
      currencySend: body.currency_send,
      currencyReceive: body.currency_receive,
      amountSend: body.amount_send,
      sellerId: body.seller_id,
    });

    send<ResXXX>(code, {
      status: code < 300,
      msg,
    });
  }
}
