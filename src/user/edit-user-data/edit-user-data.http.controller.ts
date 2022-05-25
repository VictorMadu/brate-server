import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./edit-user-data.service";

import { Headers, Body, ResXXX } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { bodySchema } from "./schema/body.schema";
import { resxxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { EDIT_USER_DATA } from "../_constant/routes";

@HttpController(EDIT_USER_DATA)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    body: bodySchema,
    response: { xxx: resxxSchema },
  })
  @HttpMethods.Post()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Body() body: Body,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg] = await this.service.handle({
      authToken: headers.authorization,
      phone: body.phone,
      email: body.email,
      name: body.name,
    });

    send<ResXXX>(code, {
      status: code < 300,
      msg,
    });
  }
}
