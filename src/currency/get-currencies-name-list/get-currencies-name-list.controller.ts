import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./get-currencies-name-list.service";

import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "../../../_interfaces";
import { CURRENCIES_NAME_LIST } from "../_constants/routes";
import { Res2xx, Res4xx } from "./interface";

@HttpController(CURRENCIES_NAME_LIST)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    response: {
      "2xx": res2xxSchema,
      "4xx": res4xxSchema,
    },
  })
  @HttpMethods.Get()
  async route(@HttpParams.Send() send: ResSend) {
    const [code, msg, payload] = await this.service.handle();

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
      data: payload,
    });
  }
}
