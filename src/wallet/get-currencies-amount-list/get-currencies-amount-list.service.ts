import { Injectable } from "victormadu-nist-core";
import { DbService } from "./get-currencies-amount-list.db";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { Res2xx } from "./interface";

interface InData {
    authToken: string;
    currencies: string[];
    pageOffset: number;
    pageCount: number;
}

type OutData = Res2xx["data"];

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: InData): Promise<[number, string, OutData | undefined]> {
        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "Authenticated Failed", undefined];

        const walletAmountData =
            (await this.dbService.getWalletAmountData({
                userId,
                currencies: [...new Set(inData.currencies)],
                pageOffset: inData.pageOffset,
                pageCount: inData.pageCount,
            })) ?? [];

        return [
            200,
            "Successful",
            {
                wallet: walletAmountData,
                pagination: {
                    skipped: inData.pageOffset,
                    page_count: walletAmountData.length,
                },
            },
        ];
    }
}
