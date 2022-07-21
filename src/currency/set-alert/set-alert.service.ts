import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./set-alert.db";

interface ServiceInData {
    authToken: string;
    targetRate: number;
    marketType: "parallel" | "black";
    baseCurrency: string;
    quotaCurrency: string;
}
@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string]> {
        if (inData.targetRate <= 0) return [400, "Bad request"];

        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "authentication Failed"];

        const isSuccessful = await this.dbService.setAlert({
            userId,
            ...inData,
        });

        if (isSuccessful) return [200, "Successful"];
        return [400, "Failed"];
    }
}
