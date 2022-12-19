import BlackRate from '../../../Application/Common/Interfaces/Entities/BlackRate';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

import {
    GetSpecificBlackRatesCommandRequest,
    GetSpecificBlackRatesCommandResponse,
} from './GetSpecificRatesCommand';

export default class GetSpecificBlackRatesManager {
    private market = [] as {
        bankRateId: string;
        userId: string;
        bankName: string;
        baseId: number;
        quotaId: number;
        rates: number[];
        createdAts: Date[];
        rowNos: number[];
    }[];

    constructor(private commandRequest: GetSpecificBlackRatesCommandRequest) {}

    async populateFromPresistor(marketRepository: MarketRepository) {
        this.market = await marketRepository.getSpecificBlackRates({
            filters: this.commandRequest,
        });
    }

    async assertPopulateSuccessful() {}

    getResponse(): GetSpecificBlackRatesCommandResponse {
        return this.market;
    }
}
