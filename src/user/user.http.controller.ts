import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";

@HttpController("/user")
export class CurrencyHttpController {
  constructor(private currencyService: UserService) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querystringSchema,
    response: responseSchema,
  })
  @HttpMethods.Get("/")
  async getCurrencyPairList(
    @HttpParams.Headers() headers: Headers,
    @HttpParams.Query() query: Query,
    @HttpParams.Send() send: ResSend
  ) {
    const [code, payload]: [
      number,
      Response["data"]
    ] = await this.currencyService.getCurrencyPairList(headers, query);
    send<Response>(code, {
      status: true,
      msg: "",
      data: payload,
    });
  }
}
