import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./delete-alert-list.db";

interface ServiceInData {
    authorization: string;
    ids: string[];
}

export type OutData = {
    deleted_count: number;
};

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string, OutData | undefined]> {
        const userId = this.authManager.parse(inData.authorization).userId;
        if (!userId) return [401, "", undefined];

        const result: number = await this.dbService.query({
            userId,
            ids: inData.ids,
        });

        return [
            200,
            "",
            {
                deleted_count: result,
            },
        ];
    }
}
