import { Injectable } from "victormadu-nist-core";
import { map } from "lodash";
import { DbService } from "./trade-list.db";

interface ServiceInData {
    pairs: string[];
    pageOffset: number;
    pageCount: number;
}

interface OutData {
    traders: {
        user_id: string;
        seller_id: string;
        seller_name: string;
        pair: string;
        amount_available: number;
        rate: number;
        created_at: number;
    }[];
    pagination: {
        page_count: number;
        skipped: number;
    };
}

@Injectable()
export class Service {
    constructor(private dbService: DbService) {}

    // TODO: Do same to their services that accept arrays
    async handle(inData: ServiceInData): Promise<[number, string, OutData]> {
        const tradersData = await this.dbService.getTradersData({
            pageOffset: inData.pageOffset,
            pageCount: inData.pageCount,
            interestedPairs: this.getPairsObj(this.getUniquePairs(inData.pairs)),
        });
        return [
            200,
            "",
            {
                traders: tradersData,
                pagination: {
                    page_count: tradersData.length,
                    skipped: inData.pageOffset,
                },
            },
        ];
    }

    private getPairsObj(pairs: string[]): { base: string; quota: string }[] {
        return map(pairs, (pair) => {
            const [base, quota] = pair.split(" ");
            return { base, quota };
        });
    }

    private getUniquePairs(pairs: string[]) {
        return [...new Set(pairs)];
    }
}
