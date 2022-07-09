import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../../utils/auth-manager.service";
import { DbService } from "./unstar-favourite.db";

interface ServiceInData {
  authToken: string;
  currency_pairs: string[];
}

interface OutData {
  deleted_count: number;
}

@Injectable()
export class Service {
  constructor(private dbService: DbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string, OutData | undefined]> {
    const userId = this.authManager.parse(inData.authToken).userId;
    if (!userId) return [401, "", undefined];

    return await this.removeAllToFavourite(userId, inData);
  }

  async removeAllToFavourite(
    userId: string,
    inData: ServiceInData
  ): Promise<[number, string, OutData | undefined]> {
    const uniqueCurrencyPairs = [...new Set(inData.currency_pairs)];
    const len = uniqueCurrencyPairs.length;
    let deletedCount = 0;
    let i = 0;
    while (i < len) {
      const [base, quota] = uniqueCurrencyPairs[i].split(" ");
      i++;
      if (base === quota || base == null) continue;
      deletedCount += await this.dbService.removeToFavourite({
        userId,
        base,
        quota,
      });
    }

    return [200, "Successful", { deleted_count: deletedCount }];
  }
}
