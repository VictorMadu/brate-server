import axios from 'axios';
import Config from '../../../Application/Common/Config';
import { NotificationType } from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

import {
    UpdateParallelMarketCommandRequest,
    UpdateParallelMarketCommandResponse,
} from './UpdateParallelMarketCommand';

type CurrencySymbol = string;
type CurrencyRate = number;
type currencyAbbrev = string;
interface CurrencyRatesRes {
    success: boolean;
    base: string;
    timestamp: number;
    date: string;
    rates: Record<CurrencySymbol, CurrencyRate>;
}

export default class UpdateParallelMarketManager {
    private market = { currencyDetails: {} } as {
        url: string;
        key: string;
        currencyDetails: Record<currencyAbbrev, { name: string; currencyId: number }>;
    };

    private static currKeyIndex = -1;

    constructor(private commandRequest: UpdateParallelMarketCommandRequest) {}

    async populateKeyAndUrl(config: Config) {
        this.market.url = config.get('parallelRatesAPI.url');
        this.obtainNextKey(config.get('parallelRatesAPI.keys'));
    }

    async hasAllCurrenciesRate(marketRepository: MarketRepository) {
        return marketRepository.hasAllCurrenciesRate();
    }

    async populateCurrencyDetails(currenciesRepository: CurrenciesRepository) {
        const currenciesDetails = await currenciesRepository.findMany();

        for (let i = 0; i < currenciesDetails.length; i++) {
            const currencyDetails = currenciesDetails[i];

            this.market.currencyDetails[currencyDetails.abbrev] = {
                ...this.market.currencyDetails[currencyDetails.abbrev],
                name: currencyDetails.name,
                currencyId: currencyDetails.currencyId,
            };
        }
    }

    // TODO: Add retry
    async getAndSaveCurrencyLatestRates(marketRepository: MarketRepository) {
        const url = this.market.url;
        const key = this.market.key;

        const obtainedData = await axios
            .get(`${url}/latest?access_key=${key}`)
            .then((response: { data: CurrencyRatesRes }) => response.data);

        const { rates, timestamp } = obtainedData;
        const newRates: {
            currencyId: number;
            rate: string;
            createdAt: Date;
        }[] = [];

        const currencyAbbrevs = Object.keys(rates);
        const createdDateTime = new Date(timestamp * 1000);

        for (let i = 0; i < currencyAbbrevs.length; i++) {
            const abbrev = currencyAbbrevs[i];
            const currencyDetail = this.market.currencyDetails[abbrev];
            newRates[i] = {
                currencyId: currencyDetail.currencyId,
                rate: rates[abbrev].toString(),
                createdAt: createdDateTime,
            };
        }

        await marketRepository.updateParallelMarket({ newRates });
    }

    // TODO: Reorganize and handle well
    async triggerReachedAlerts(alertRepository: AlertRepository) {
        await Promise.all([
            alertRepository.triggerReachedParallelMarket({
                type: NotificationType.ALERT_TRIGGERED,
            }),
        ]);
    }

    async selfGenerateRates(marketRepository: MarketRepository) {
        await marketRepository.updateParallelMarketWithSelfGeneratedData();
    }

    private obtainNextKey(allKeys: string[]) {
        UpdateParallelMarketManager.currKeyIndex =
            UpdateParallelMarketManager.currKeyIndex + (1 % allKeys.length);
        this.market.key = allKeys[UpdateParallelMarketManager.currKeyIndex];
    }

    getResponse(): UpdateParallelMarketCommandResponse {
        return;
    }
}
