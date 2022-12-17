import BlackRate from '../../../Application/Common/Interfaces/Entities/BlackRate';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import PriceAlert from '../../../Application/Common/Interfaces/Entities/PriceAlert';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

import {
    GetGeneralRatesCommandRequest,
    GetGeneralRatesCommandResponse,
} from './GetGeneralRatesCommand';

export default class GetGeneralRatesManager {
    private user = {} as Pick<User, 'userId'>;
    private market = [] as Pick<BlackRate, 'base' | 'quota' | 'rates' | 'createdAts'>[];

    constructor(private commandRequest: GetGeneralRatesCommandRequest) {}

    async populateFromPresistor(marketRepository: MarketRepository) {
        const getGeneralRatesResult = await marketRepository.getOverAllBlackRates({
            filters: this.commandRequest,
        });

        this.market = getGeneralRatesResult;
    }

    async assertPopulateSuccessful() {}

    getResponse(): GetGeneralRatesCommandResponse {
        return this.market;
    }
}
