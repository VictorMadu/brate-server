import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    GetGeneralRatesCommandRequest,
    GetGeneralRatesCommandResponse,
} from './GetGeneralRatesCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import GetGeneralRatesManager from './GetGeneralRatesManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

export default class GetGeneralRatesCommandHandler
    implements CommandHandler<GetGeneralRatesCommandRequest, GetGeneralRatesCommandResponse>
{
    constructor(private marketRepository: MarketRepository) {}

    async handle(
        commandRequest: GetGeneralRatesCommandRequest,
    ): Promise<GetGeneralRatesCommandResponse> {
        const getGeneralRatesManager = new GetGeneralRatesManager(commandRequest);

        await getGeneralRatesManager.populateFromPresistor(this.marketRepository);
        await getGeneralRatesManager.assertPopulateSuccessful();

        return getGeneralRatesManager.getResponse();
    }
}
