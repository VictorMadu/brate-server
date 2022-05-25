import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./refresh-token.service";
import { ResSend } from "../../_interfaces";

import { Headers, Res2xx, Res4xx } from "./interface";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { REFRESH_TOKEN } from "../_constant/routes";
import { headerSchema } from "./schema/header.schema";

const DEFAULT_INCLUDE_TOKEN = false;

@HttpController(REFRESH_TOKEN)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    // response: {
    //   '2xx': res2xxSchema,
    //   '4xx': res4xxSchema
    // }
  })
  @HttpMethods.Post()
  async route(@HttpParams.Send() send: ResSend, @HttpParams.Headers() headers: Headers) {
    const [code, msg, data] = await this.service.handle({
      authToken: headers.authorization,
    });

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
      data,
    });
  }
}
