import { map } from "lodash";
import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./seller-pairs-for-sale-data-list.db";

interface ServiceInData {
  authToken?: string;
  pairs: string[];
  pageOffset: number;
  pageCount: number;
}

interface OutData {
  rates: {
    pair: string;
    rate: number;
  }[];
  pagination: {
    page_count: number;
    skipped: number;
  };
}

@Injectable()
export class Service {
  constructor(
    private dbService: DbService,
    private authManager: AuthManagerService
  ) {}

  // TODO: Do same to their services that accept arrays
  async handle(
    inData: ServiceInData
  ): Promise<[number, string, OutData | undefined]> {
    const userId = this.getAuthToken(inData);
    if (userId == null) return [401, "authentication Failed", undefined];

    const ratesData = await this.dbService.getCurrenciesForSaleData({
      userId,
      pageOffset: inData.pageOffset,
      pageCount: inData.pageCount,
      pairs: this.getPairsObj(this.getUniquePairs(inData.pairs)),
    });
    return [
      200,
      "",
      {
        rates: ratesData,
        pagination: {
          page_count: ratesData.length,
          skipped: inData.pageOffset,
        },
      },
    ];
  }

  private getAuthToken({ authToken }: ServiceInData) {
    if (authToken == null) return undefined;

    const { userId } = this.authManager.parse(authToken);
    return userId;
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
