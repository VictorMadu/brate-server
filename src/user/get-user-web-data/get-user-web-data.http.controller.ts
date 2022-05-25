import { HttpController } from "nist-fastify-adapter/injectables/http-controller";
import * as HttpMethods from "nist-fastify-adapter/injectables/http.method.decorators";
import * as HttpParams from "nist-fastify-adapter/injectables/http.param.decorators";
import { Service } from "./get-user-web-data.service";

import { Headers, Query, Res2xx, Res4xx } from "./interface";
import { headerSchema } from "./schema/header.schema";
import { querystringSchema } from "./schema/querystring.schema";
import { res2xxSchema, res4xxSchema } from "./schema/response.schema";
import { ResSend } from "_interfaces";
import { GET_USER_WEB_DATA } from "../_constant/routes";

@HttpController(GET_USER_WEB_DATA)
export class Controller {
  constructor(private service: Service) {}

  @HttpMethods.Schema({
    headers: headerSchema,
    querystring: querystringSchema,
    // response: {
    //   '2xx': res2xxSchema,
    //   '4xx': res4xxSchema,
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
    if (this.isAllNull(query)) {
      return {
        include_web_client_id: true,
        include_language: true,
        include_remove_trade_notification_after: true,
        include_remove_price_alert_notification_after: true,
        include_remove_fund_notification_after: true,
        include_bereau_de_change: true,
        include_dark_mode: true,
      };
    }
    return {
      include_web_client_id: query.include_web_client_id ?? false,
      include_language: query.include_language ?? false,
      include_remove_trade_notification_after:
        query.include_remove_trade_notification_after ?? false,
      include_remove_price_alert_notification_after:
        query.include_remove_price_alert_notification_after ?? false,
      include_remove_fund_notification_after: query.include_remove_fund_notification_after ?? false,
      include_bereau_de_change: query.include_bereau_de_change ?? false,
      include_dark_mode: query.include_dark_mode ?? false,
    };
  }

  private isAllNull(query: Query) {
    if (!this.isNull(query.include_web_client_id)) return false;
    if (!this.isNull(query.include_language)) return false;
    if (!this.isNull(query.include_remove_trade_notification_after)) return false;
    if (!this.isNull(query.include_remove_price_alert_notification_after)) return false;
    if (!this.isNull(query.include_remove_fund_notification_after)) return false;
    if (!this.isNull(query.include_bereau_de_change)) return false;
    if (!this.isNull(query.include_dark_mode)) return false;
    return true;
  }

  private isNull(obj: any) {
    return obj == null;
  }
}
