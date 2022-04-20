import { ResSend } from "../../../_interfaces";
import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { ALERT_LIST } from "../_constants/routes";
import { Service } from "./delete-alert-list.service";

import { Body, Headers, Response } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { responseSchema } from "./schema/response.schema";

@HttpController(ALERT_LIST)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    body: bodySchema,
    response: responseSchema,
  })
  @HttpMethods.Post()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Body() body: Body,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg, payload] = await this.service.handle({
      authorization: headers.authorization,
      ids: this.getIds(body.ids, body.id),
    });

    send<Response>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }

  getIds(ids?: string[], id?: string) {
    if (ids) return ids;
    if (id) return [id];
    return [];
  }
}
