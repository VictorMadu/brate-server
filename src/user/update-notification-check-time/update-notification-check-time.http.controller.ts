import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./update-notification-check-time.service";

import { Headers, Body, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { UPDATE_NOTIFICATION_LAST_CHECK } from "../_constant/routes";

@HttpController(UPDATE_NOTIFICATION_LAST_CHECK)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    body: bodySchema,
    // response: {
    //   "2xx": res2xxSchema,
    //   "4xx": res4xxSchema,
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
      lastCheckTime: body.last_check_time,
    });

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
    });
  }
}
