import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { GetAlertListDbService } from "./get-notification-list.db";
import { Res2xx } from "./interface";

interface ServiceInData {
    authToken: string;
    type?: "P" | "F" | "T";
    pageCount: number;
    pageOffset: number;
    from: number | undefined;
    to: number | undefined;
}

@Injectable()
export class Service {
    constructor(
        private dbService: GetAlertListDbService,
        private authManager: AuthManagerService
    ) {}

    async handle(inData: ServiceInData): Promise<[number, string, Res2xx["data"] | undefined]> {
        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "Not Authenticated", undefined];

        const result = await this.dbService.getNotificationData({
            userId,
            type: inData.type,
            pageCount: inData.pageCount,
            pageOffset: inData.pageOffset,
            from: inData.from,
            to: inData.to,
        });

        return [
            200,
            "",
            {
                count_from_last_check: result.totalFromLastCheck,
                notifications: result.notifications,
                pagination: {
                    skipped: inData.pageOffset,
                    page_count: result.notifications.length,
                },
            },
        ];
    }
}
