import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./edit-user-web-data.db";

interface ServiceInData {
    authToken: string;
    language?: "English" | "French";
    remove_trade_notification_after?: number;
    remove_price_alert_notification_after?: number;
    remove_fund_notification_after?: number;
    bereau_de_change?: boolean;
    dark_mode?: boolean;
}

interface OutData {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
}

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string]> {
        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "authentication Failed"];

        const isSuccessful = await this.dbService.editUserWebData({
            userId,
            ...inData,
        });

        if (isSuccessful) return [200, "Successful"];
        return [400, "Failed"];
    }
}
