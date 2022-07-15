import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./get-ws-ticket.db";

interface ServiceInData {
    authToken: string;
    ip?: string;
}

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string]> {
        const { ip, authToken } = inData;
        if (ip == null) return [400, "IP address is unknown"];

        const userId = this.authManager.parse(authToken).userId;
        if (!userId) return [401, "Authentication Failed"];

        const isSuccessful = await this.dbService.createWsTicketForUser({
            userId,
            ip,
        });

        if (isSuccessful) return [200, "Successful"];
        return [400, "Failed"];
    }
}
