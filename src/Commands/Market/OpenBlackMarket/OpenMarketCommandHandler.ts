import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import { openBlackMarketCommandRequest, openBlackMarketCommandResponse } from './OpenMarketCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import OpenMarketManager from './OpenMarketManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

export default class OpenBlackMarketCommandHandler
    implements CommandHandler<openBlackMarketCommandRequest, openBlackMarketCommandResponse>
{
    constructor(
        private marketRepository: MarketRepository,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(
        commandRequest: openBlackMarketCommandRequest,
    ): Promise<openBlackMarketCommandResponse> {
        const openBlackMarketManager = new OpenMarketManager(commandRequest);

        await openBlackMarketManager.populateUserFromAuthManager(this.authTokenManager);
        await openBlackMarketManager.updatePresistor(this.marketRepository);
        await openBlackMarketManager.assertUpdateSuccessful();

        return openBlackMarketManager.getResponse();
    }
}
