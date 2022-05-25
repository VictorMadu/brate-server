import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./sign-in.service";
import { ResSend } from "../../_interfaces";

import { Body, Res2xx, Res4xx } from "./interface";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { SIGN_IN } from "../_constant/routes";
import { bodySchema } from "./schema/body.schema";

const DEFAULT_INCLUDE_TOKEN = false;

@HttpController(SIGN_IN)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    body: bodySchema,
    // response: {
    //   '2xx': res2xxSchema,
    //   '4xx': res4xxSchema
    // }
  })
  @HttpMethods.Post()
  async route(@HttpParams.Send() send: ResSend, @HttpParams.Body() body: Body) {
    const [code, msg, data] = await this.service.handle({
      email: body.email,
      password: body.password,
    });

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
      data,
    });
  }
}
