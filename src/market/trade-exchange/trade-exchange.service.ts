import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./trade-exchange.db";

interface ServiceInData {
  authToken: string;
  currencySend: string;
  currencyReceive: string;
  amountSend: number;
  sellerId: string;
}
@Injectable()
export class Service {
  constructor(private dbService: DbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string]> {
    if (inData.currencySend === inData.currencyReceive) return [400, "Failed"];
    const userId = this.authManager.parse(inData.authToken).userId;
    if (!userId) return [401, "authentication Failed"];

    const isSuccessful = await this.dbService.buyCurrencyFromSeller({
      buyerUserId: userId,
      ...inData,
    });

    if (isSuccessful) return [200, "Successful"];
    return [400, "Failed"];
  }
}
