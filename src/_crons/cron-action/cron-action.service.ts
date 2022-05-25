import axios, { AxiosResponse } from "axios";
import { Injectable } from "nist-core/injectables";
import { CronJob } from "cron";
import { ConfigService } from "../../utils/config-factory.service";
import { DbService } from "./update-parallel-rate.db";
import { forEach } from "lodash";
import { DiminishingRetry, MultipleIncr } from "../../utils/diminishing-retry";
import { NotificationTriggerAndFunctionDbService } from "./triggers.db";

type DbInData = {
  time: number;
  rate: number;
  currency_id: string;
}[];

const START_TIME = 1 * 60 * 1000; // 1 mins
const STEP = 5;
const END_TIME = 1 * 60 * 60 * 1000; // 1 hour

@Injectable()
export class CronActionService {
  private parallelCurrencyRateGetter: ParallelCurrencyRateGetter;
  private currencies: string[] = [];
  private deleteExpiredNotificationCron: CronJob;
  private currencyParallelRateUpdateCron: CronJob;
  constructor(
    private configService: ConfigService,
    private dbService: DbService,
    private notificationDbService: NotificationTriggerAndFunctionDbService
  ) {
    this.parallelCurrencyRateGetter = new ParallelCurrencyRateGetter(
      this.getUrl(),
      this.getApiKeys()
    );

    this.deleteExpiredNotificationCron = this.createDeleteExpiredNotificationCron();
    this.currencyParallelRateUpdateCron = this.createCurrencyParallelRateUpdateCron();
  }

  private async onStart() {
    // await this.setCurrenciesCtx();
    // this.deleteExpiredNotificationCron.start();
    // if (this.currencies.length > 0) return this.currencyParallelRateUpdateCron.start();
  }

  private async onClose() {
    // this.closeCronJob(this.deleteExpiredNotificationCron);
    // this.closeCronJob(this.currencyParallelRateUpdateCron);
  }

  private closeCronJob(cronJob: CronJob) {
    if (cronJob.running) cronJob.stop();
  }

  private async setCurrenciesCtx() {
    let currencies = await this.dbService.getCurrencies();
    if (!currencies || currencies.length === 0)
      currencies = await this.setAndGetCurrencyNamesInDbWithRetry();

    this.currencies = currencies ?? [];
  }

  private async setAndGetCurrencyNamesInDbWithRetry(): Promise<string[] | undefined> {
    const diminishingRetry = new DiminishingRetry(new MultipleIncr(START_TIME, 2, END_TIME));

    return await diminishingRetry.run(async () => await this.setAndGetCurrencyNamesInDb());
  }

  private createCurrencyParallelRateUpdateCron() {
    const cronDiminishingRetry = new DiminishingRetry(new MultipleIncr(START_TIME, STEP, END_TIME));
    return new CronJob("50 * * * * *", () => {
      console.log("Running Cron Job `getNewParallelCurrencyRate`");
      this.getNewParallelCurrencyRate();
    });
  }

  private createDeleteExpiredNotificationCron() {
    return new CronJob("50 * * * * *", () => {
      console.log("Running Cron Job `notificationDbService.deleteExpiredNotification`");
      this.notificationDbService.deleteExpiredNotification();
    });
  }

  private async setAndGetCurrencyNamesInDb() {
    const apiResult = await this.parallelCurrencyRateGetter.getCurrencySymbolAndNames();

    const { success, symbols: currencySymbolsAndNames } = apiResult.data;
    if (!success) return;
    return await this.dbService.storeCurrencyName(currencySymbolsAndNames);
  }

  private async getNewParallelCurrencyRate(): Promise<boolean | undefined> {
    console.log("Trying to update parallel currency rate");

    const result = await this.parallelCurrencyRateGetter.get();
    const { rates, timestamp, success } = result.data;
    if (!success) return await this.getNewParallelCurrencyRate();

    const dbInData: DbInData = [];
    forEach(this.currencies, (currency) => {
      dbInData.push({
        time: timestamp,
        rate: rates[currency],
        currency_id: currency,
      });
    });

    const isSuccessful = await this.dbService.updateParallelRates(dbInData);
    console.log("Parallel price update was ", isSuccessful ? "" : "not ", "successful\n");
    return isSuccessful;
  }

  private getUrl() {
    return this.configService.get<"currency_rate.url">("currency_rate.url");
  }

  private getApiKeys() {
    return this.configService.get<"currency_rate.api_keys">("currency_rate.api_keys");
  }
}

class ParallelCurrencyRateGetter {
  curKeyIndex = -1;
  constructor(private baseUrl: string, private apiKeys: string[]) {}

  // async get() {
  //   return (await axios({
  //     method: "GET",
  //     url: this.baseUrl + `/latest/?access_skey=${this.getApiKeyAndMoveCurPointer()}&base=USD`,
  //   })) as AxiosResponse<{
  //     success: boolean;
  //     base: string;
  //     timestamp: number;
  //     date: string;
  //     rates: Record<string, number>;
  //   }>;
  // }

  async get(): Promise<{
    data: {
      success: boolean;
      base: string;
      timestamp: number;
      date: string;
      rates: Record<string, number>;
    };
  }> {
    this.curKeyIndex = (this.curKeyIndex + 1) % 10;
    return {
      data: {
        success: true,
        base: "USD",
        timestamp: Date.now() / 1000,
        date: Date.now().toString(),
        rates: {
          USD: 1,
          EUR: 20 + this.curKeyIndex,
          GBP: 3 + this.curKeyIndex,
          NGN: 4 + this.curKeyIndex,
          ZAR: 5 + this.curKeyIndex,
        },
      },
    };
  }

  // async getCurrencySymbolAndNames() {
  //   return (await axios({
  //     method: "GET",
  //     url: this.baseUrl + `/symbols/?access_skey=${this.getApiKeyAndMoveCurPointer()}`,
  //   })) as AxiosResponse<{
  //     success: boolean;
  //     symbols: Record<string, string>;
  //   }>;
  // }

  // For test
  async getCurrencySymbolAndNames() {
    return {
      data: {
        success: true,
        symbols: {
          USD: "United State Dollars",
          EUR: "Euro",
          GBP: "Great Britian Pounds",
          NGN: "Nigeria Naira",
          RND: "South African Rands",
        },
      },
    };
  }

  private getApiKeyAndMoveCurPointer() {
    this.moveCurIndexToNext();
    return this.getCurApiKey();
  }

  private getCurApiKey() {
    return this.apiKeys[this.curKeyIndex];
  }

  private moveCurIndexToNext() {
    this.curKeyIndex = (this.curKeyIndex + 1) % this.apiKeys.length;
  }
}
