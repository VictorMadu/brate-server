import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    GetSpecificBlackRatesCommandRequest,
    GetSpecificBlackRatesCommandResponse,
} from './GetSpecificRatesCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import GetSpecificBlackRatesManager from './GetSpecificRatesManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

export default class GetSpecificRatesCommandHandler
    implements
        CommandHandler<GetSpecificBlackRatesCommandRequest, GetSpecificBlackRatesCommandResponse>
{
    constructor(private marketRepository: MarketRepository) {}

    async handle(
        commandRequest: GetSpecificBlackRatesCommandRequest,
    ): Promise<GetSpecificBlackRatesCommandResponse> {
        const getSpecificBlackRatesManager = new GetSpecificBlackRatesManager(commandRequest);

        await getSpecificBlackRatesManager.populateFromPresistor(this.marketRepository);
        await getSpecificBlackRatesManager.assertPopulateSuccessful();

        return getSpecificBlackRatesManager.getResponse();
    }
}
