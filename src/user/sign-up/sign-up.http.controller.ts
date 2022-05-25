import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./sign-up.service";
import { ResSend } from "../../_interfaces";

import { Body, ResXXX } from "./interface";
import { bodySchema } from "./schema/body.schema";
import { resxxxSchema } from "./schema/response.schema";
import { SIGN_UP } from "../_constant/routes";
import { FastifyRequest, FastifyReply } from "fastify";

@HttpController(SIGN_UP)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    body: bodySchema,
    response: {
      xxx: resxxxSchema,
    },
  })
  @HttpMethods.Post()
  async route(@HttpParams.Body() body: Body, @HttpParams.Send() send: ResSend) {
    const [code, msg] = await this.service.handle({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
    });

    send<ResXXX>(code, {
      status: code < 300,
      msg,
    });
  }
}
