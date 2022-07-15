import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./get-user-data.db";

interface ServiceInData {
    authToken: string;
    includeEmail: boolean;
    includePhone: boolean;
    includeName: boolean;
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

    async handle(inData: ServiceInData): Promise<[number, string, OutData | undefined]> {
        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "authentication Failed", undefined];

        console.log("User data", inData);

        const userData = await this.dbService.getUserData({
            userId,
            ...inData,
        });

        if (userData) return [200, "Successful", userData];
        return [400, "Failed", undefined];
    }
}
