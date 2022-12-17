import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    CloseBlackMarketCommandRequest,
    CloseBlackMarketCommandResponse,
} from './CloseMarketCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import CloseBlackMarketManager from './CloseMarketManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

export default class CloseBlackMarketCommandHandler
    implements CommandHandler<CloseBlackMarketCommandRequest, CloseBlackMarketCommandResponse>
{
    constructor(private marketRepository: MarketRepository) {}

    async handle(
        commandRequest: CloseBlackMarketCommandRequest,
    ): Promise<CloseBlackMarketCommandResponse> {
        const closeBlackMarketManager = new CloseBlackMarketManager(commandRequest);

        await closeBlackMarketManager.updatePresistor(this.marketRepository);
        await closeBlackMarketManager.assertUpdateSuccessful();

        return closeBlackMarketManager.getResponse();
    }
}
