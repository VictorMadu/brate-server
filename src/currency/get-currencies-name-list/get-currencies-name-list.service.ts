import { Injectable } from "victormadu-nist-core";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./get-currencies-name-list.db";
import { Res2xx } from "./interface";

interface ServiceInData {}
@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(): Promise<[number, string, Res2xx["data"] | undefined]> {
        const currenciesData = await this.dbService.getCurrenciesName();

        return [
            200,
            "",
            {
                currencies: currenciesData,
            },
        ];
    }
}
