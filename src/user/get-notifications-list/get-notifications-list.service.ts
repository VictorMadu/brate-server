import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./get-notifications-list.db";
import { Response } from "./interface";

interface ServiceInData {
  authToken: string;
  pageCount: number;
  pageOffset: number;
  timeFrom?: number;
  timeTo?: number;
  type?: "P" | "T" | "F";
}

interface OutData {
  id: string;
  type: "P" | "T" | "F";
  msg: string;
  created_at: number;
}

@Injectable()
export class Service {
  constructor(private dbService: DbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string, Response["data"] | undefined]> {
    const userId = this.authManager.parse(inData.authToken).userId;
    if (!userId) return [401, "authentication Failed", undefined];

    const notificationData: OutData[] | undefined = await this.dbService.getUserNotificationData({
      userId,
      ...inData,
    });

    if (notificationData)
      return [
        200,
        "Successful",
        {
          notifications: notificationData,
          pagination: {
            page_count: notificationData.length,
            skipped: inData.pageOffset,
          },
        },
      ];
    return [400, "Failed", undefined];
  }
}
