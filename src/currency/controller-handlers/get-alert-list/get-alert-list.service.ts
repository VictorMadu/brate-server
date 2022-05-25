import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../../utils/auth-manager.service";
import { GetAlertListDbService } from "./get-alert-list.db";
import { Res2XX } from "./interface";

interface ServiceInData {
  authorization: string;
  page_count: number;
  market_type: "parallel" | "black";
  page_offset: number;
  filter: "all" | "untriggered" | "triggered";
}
@Injectable()
export class Service {
  constructor(private dbService: GetAlertListDbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string, Res2XX["data"] | undefined]> {
    const userId = this.authManager.parse(inData.authorization).userId;
    if (!userId) return [401, "", undefined];

    const result = await this.dbService.getPriceAlerts({
      userId,
      filter: inData.filter,
      market_type: inData.market_type,
      offset: inData.page_offset,
      limit: inData.page_count,
    });

    return [
      200,
      "",
      {
        alerts: result,
        pagination: {
          skipped: inData.page_offset,
          page_count: result.length,
        },
      },
    ];
  }
}
