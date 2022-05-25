import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./get-user-data.service";

import { Headers, Query, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { GET_USER_DATA } from "../_constant/routes";

@HttpController(GET_USER_DATA)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querystringSchema,
    // response: {
    //   "2xx": res2xxSchema,
    //   "4xx": res4xxSchema,
    // },
  })
  @HttpMethods.Get()
  async route(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, msg, data] = await this.service.handle({
      authToken: headers.authorization,
      ...this.getIncludeObj(query),
    });

    send<Res2xx | Res4xx>(code, {
      status: code < 300,
      msg,
      data,
    });
  }

  private getIncludeObj(query: Query) {
    if (this.queryHaveNoInclude(query)) {
      return {
        includeEmail: true,
        includePhone: true,
        includeName: true,
      };
    }
    return {
      includeEmail: query.include_email ?? false,
      includePhone: query.include_phone ?? false,
      includeName: query.include_name ?? false,
    };
  }

  private queryHaveNoInclude(query: Query) {
    return query.include_email == null && query.include_name == null && query.include_phone == null;
  }
}
