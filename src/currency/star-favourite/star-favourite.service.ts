import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./star-favourite.db";

interface ServiceInData {
    authToken: string;
    currency_pairs: string[];
}

interface OutData {
    inserted_count: number;
}

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string, OutData | undefined]> {
        const userId = this.authManager.parse(inData.authToken).userId;
        if (!userId) return [401, "", undefined];

        return await this.addAllToFavourite(userId, inData);
    }

    async addAllToFavourite(
        userId: string,
        inData: ServiceInData
    ): Promise<[number, string, OutData | undefined]> {
        const uniqueCurrencyPairs = [...new Set(inData.currency_pairs)];

        let insertedCount = 0;
        for (let i = 0; i < uniqueCurrencyPairs.length; i++) {
            const [base, quota] = uniqueCurrencyPairs[i].split(" ");
            if (base === quota || base == null) continue;
            insertedCount += await this.dbService.addToFavourite({
                userId,
                base,
                quota,
            });
        }

        return [200, "Successful", { inserted_count: insertedCount }];
    }
}
