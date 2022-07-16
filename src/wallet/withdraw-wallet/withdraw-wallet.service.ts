import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./withdraw-wallet.db";

interface ServiceInData {
    authToken: string;
    amountToWithdraw: number;
    currencyToWithdraw: string;
}

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string]> {
        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "authentication Failed"];

        const isSuccessful = await this.dbService.withdrawFromUserWallet({
            userId,
            ...inData,
        });

        if (isSuccessful) return [200, "Successful"];
        return [400, "Failed"];
    }
}
