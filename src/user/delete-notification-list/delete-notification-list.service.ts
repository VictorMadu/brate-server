import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { GetAlertListDbService } from "./delete-notification-list.db";
import { Res2xx } from "./interface";

interface ServiceInData {
    authToken: string;
    ids: string[];
}
@Injectable()
export class Service {
    constructor(
        private dbService: GetAlertListDbService,
        private authManager: AuthManagerService
    ) {}

    async handle(inData: ServiceInData): Promise<[number, string, Res2xx["data"] | undefined]> {
        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "", undefined];

        const deleteCounts = await this.dbService.deleteUserNotifications({
            userId,
            ids: [...new Set(inData.ids)],
        });

        return [
            200,
            "",
            {
                deleted_count: deleteCounts,
            },
        ];
    }
}
