import { InData, ResTuple } from "./interface";
import { GetCurrencyPairListDbService } from "./get-currency-rate-and-data.db";
import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../utils/auth-manager.service";

interface ServiceInData {
  authToken: string | undefined;
  base: string;
  from: number;
  include_favourites: boolean;
  market_type: "parallel" | "black";
  steps: number;
  interval: number;
  page_offset: number;
  page_count: number;
}

@Injectable()
export class Service {
  constructor(
    private dbService: GetCurrencyPairListDbService,
    private authManager: AuthManagerService
  ) {}

  async handle(inData: ServiceInData): Promise<ResTuple> {
    const currencies_rates = await this.dbService.getCurrenciesRates(this.getDataForDb(inData));
    return [
      200,
      "",
      {
        currency_pairs: {
          base: inData.base,
          favourites: await this.getFavourites(this.getUserId(inData)),
          data: currencies_rates,
        },
        pagination: {
          page_count: currencies_rates.length,
          skipped: inData.page_offset,
        },
      },
    ];
  }

  private getUserId(inData: ServiceInData) {
    const authToken = inData.authToken;
    if (!authToken) return undefined;
    return this.authManager.parse(authToken)?.userId;
  }

  private async getFavourites(userId: string | undefined) {
    if (!userId) return [];
    return (await this.dbService.getFavourites(userId)) ?? [];
  }

  private getDataForDb(inData: ServiceInData): InData {
    const { interval, steps, from } = inData;
    return {
      market_type: inData.market_type,
      base: inData.base,
      interval,
      from,
      offset: inData.page_offset,
      limit: inData.page_count,
      to: from + steps * interval,
    };
  }
}
