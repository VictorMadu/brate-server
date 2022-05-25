import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./get-ws-ticket.service";

import { Headers, Resxx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { resxxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { GET_WS_TICKET } from "../_constant/routes";
import { FastifyRequest } from "fastify";

@HttpController(GET_WS_TICKET)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    // response: {
    //   xxx: resxxxSchema
    // },
  })
  @HttpMethods.Post()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Send() send: ResSend,
    @HttpParams.Req() rep: FastifyRequest
  ) {
    const [code, msg] = await this.service.handle({
      authToken: headers.authorization,
      ip: rep.socket.remoteAddress,
    });

    send<Resxx>(code, {
      status: code < 300,
      msg,
    });
  }
}
