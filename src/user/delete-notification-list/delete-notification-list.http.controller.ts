import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./delete-notification-list.service";

import { Headers, Query, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querySchema } from "./schema/query.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "../../_interfaces";
import { DELETE_NOTIFICATIONS } from "../_constant/routes";

@HttpController(DELETE_NOTIFICATIONS)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querySchema,
    // response: {
    //   '2xx': res2xxSchema,
    //   '4xx': res4xxSchema,
    // },
  })
  @HttpMethods.Delete()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg, payload] = await this.service.handle({
      authToken: headers.authorization,
      ids: query.ids,
    });

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }
}
