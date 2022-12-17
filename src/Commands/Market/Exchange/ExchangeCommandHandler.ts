import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import { ExchangeCommandRequest, ExchangeCommandResponse } from './ExchangeCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import ExchangeManager from './ExchangeManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';
import TradeRepository from '../../../Repositories/Erate/ErateTradeRepository';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';

export default class ExchangeCommandHandler
    implements CommandHandler<ExchangeCommandRequest, ExchangeCommandResponse>
{
    constructor(
        private authTokenManager: AuthTokenManager,
        private tradeRepository: TradeRepository,
        private notificationRepository: NotificationRepository,
        private dbManager: DbManager,
    ) {}

    async handle(commandRequest: ExchangeCommandRequest): Promise<ExchangeCommandResponse> {
        const exchangeManager = new ExchangeManager(commandRequest);

        await exchangeManager.populateFromAuthManager(this.authTokenManager);
        await exchangeManager.populateExchangeDetails(this.tradeRepository);
        await exchangeManager.exchangeAndNotify(
            this.dbManager,
            this.tradeRepository,
            this.notificationRepository,
        );

        return exchangeManager.getResponse();
    }
}
