import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./set-black-rate.db";

interface ServiceInData {
  authToken: string;
  rate?: number;
  baseCurrency: string;
  quotaCurrency: string;
}
@Injectable()
export class Service {
  constructor(private dbService: DbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string]> {
    if (inData.baseCurrency === inData.quotaCurrency) return [400, "Failed"];

    const userId = this.authManager.parse(inData.authToken).userId;
    if (!userId) return [401, "authentication Failed"];

    const isSuccessful = await this.runDbService(userId, inData);
    if (isSuccessful) return [200, "Successful"];

    return [400, "Failed"];
  }

  async runDbService(userId: string, inData: ServiceInData) {
    const rate = inData.rate;
    if (rate == null) {
      return await this.dbService.dropUserBlackCurrencyRate({
        userId,
        ...inData,
      });
    }
    return await this.dbService.setUserBlackCurrencyRate({
      userId,
      ...inData,
      rate,
    });
  }
}
