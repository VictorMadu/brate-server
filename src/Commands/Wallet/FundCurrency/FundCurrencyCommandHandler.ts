import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import { FundCurrencyCommandRequest, FundCurrencyCommandResponse } from './FundCurrencyCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import fundCurrencyManager from './FundCurrencyManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import WalletRepository from '../../../Repositories/Erate/ErateWalletRepository';
import FundCurrencyManager from './FundCurrencyManager';

export default class FundCurrencyCommandHandler
    implements CommandHandler<FundCurrencyCommandRequest, FundCurrencyCommandResponse>
{
    constructor(
        private authTokenManager: AuthTokenManager,
        private dbManager: DbManager,
        private walletRepository: WalletRepository,
        private notificationRepository: NotificationRepository,
    ) {}

    async handle(commandRequest: FundCurrencyCommandRequest): Promise<FundCurrencyCommandResponse> {
        const fundCurrencyManager = new FundCurrencyManager(commandRequest);

        await fundCurrencyManager.populateUserFromAuthManager(this.authTokenManager);
        await fundCurrencyManager.fund(
            this.dbManager,
            this.walletRepository,
            this.notificationRepository,
        );

        return fundCurrencyManager.getResponse();
    }
}
