import { ResSend } from "interfaces";
import { FromSchema } from "json-schema-to-ts";
import { Inject } from "nist-core";
import {
  HttpController,
  HttpMethodDecos,
  HttpParamDecos,
} from "nist-fastify-adapter";
import { CurrencyService } from "./currency.service";
import {
  Headers,
  Query,
  Response,
} from "./controller-handlers/get-currency-pair-list/interface";
import { headerSchema } from "./controller-handlers/get-currency-pair-list/schema/header.schema";
import { querystringSchema } from "./controller-handlers/get-currency-pair-list/schema/querystring.schema";
import { responseSchema } from "./controller-handlers/get-currency-pair-list/schema/response.schema";

@HttpController("/currency-pair")
export class CurrencyHttpController {
  constructor(
    @Inject(CurrencyService) private currencyService: CurrencyService
  ) {}

  @HttpMethodDecos.Schema({
    headers: headerSchema,
    querystring: querystringSchema,
    response: responseSchema,
  })
  @HttpMethodDecos.Get("/list")
  async getCurrencyPairList(
    @HttpParamDecos.Headers() headers: Headers,
    @HttpParamDecos.Query() query: Query,
    @HttpParamDecos.Send() send: ResSend
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
