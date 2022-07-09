import { ResSend } from "../../../_interfaces";
import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { ALERT } from "../_constants/routes";
import { Service } from "./delete-alert-list.service";

import { Query, Headers, Res2XX, Res4XX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querySchema } from "./schema/query.schema";
import { res2XXSchema, res4XXSchema } from "./schema/response.schema";

@HttpController(ALERT)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querySchema,
    // response: {
    //   '2xx': res2XXSchema,
    //   '4xx': res4XXSchema,
    // },
  })
  @HttpMethods.Delete()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg, payload] = await this.service.handle({
      authorization: headers.authorization,
      ids: this.getIds(query.ids),
    });

    send<Res2XX | Res4XX>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }

  getIds(ids: string) {
    return ids.split(",");
  }
}
