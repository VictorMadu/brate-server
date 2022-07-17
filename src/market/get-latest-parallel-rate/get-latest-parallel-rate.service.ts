import { Injectable } from "victormadu-nist-core";
import { DbService } from "./get-latest-parallel-rate.db";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { Res2XX } from "./interface";

interface ServiceInData {
    token?: string;
    base: string;
    pageOffset: number;
    pageCount: number;
    filter: "all" | "favourite" | "unfavourite";
}

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string, Res2XX["data"] | undefined]> {
        const currencies_rates = await this.dbService.getLatestRate({
            ...inData,
            userId: this.getUserId(inData),
        });
        if (currencies_rates)
            return [
                200,
                "Successfully",
                {
                    currency_pairs: currencies_rates,
                    pagination: {
                        page_count: currencies_rates.length,
                        skipped: inData.pageOffset,
                    },
                },
            ];

        return [400, "Failed", undefined];
    }

    private getUserId(inData: ServiceInData) {
        const { token } = inData;
        if (!token) return;
        return this.authManager.parse(token).userId;
    }
}
