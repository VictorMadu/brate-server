import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./get-user-web-data.db";

interface ServiceInData {
  authToken: string;
  include_web_client_id: boolean;
  include_language: boolean;
  include_remove_trade_notification_after: boolean;
  include_remove_price_alert_notification_after: boolean;
  include_remove_fund_notification_after: boolean;
  include_bereau_de_change: boolean;
  include_dark_mode: boolean;
}

interface OutData {
  user_id: string;
  web_client_id?: string;
  language?: "English" | "French";
  remove_trade_notification_after?: number;
  remove_price_alert_notification_after?: number;
  remove_fund_notification_after?: number;
  bereau_de_change?: boolean;
  dark_mode?: boolean;
}

@Injectable()
export class Service {
  constructor(private dbService: DbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string, OutData | undefined]> {
    const userId = this.authManager.parse(inData.authToken).userId;
    if (!userId) return [401, "authentication Failed", undefined];

    const userData = await this.dbService.getUserWebData({
      userId,
      ...inData,
    });

    if (userData) return [200, "Successful", userData];
    return [400, "Failed", undefined];
  }
}
