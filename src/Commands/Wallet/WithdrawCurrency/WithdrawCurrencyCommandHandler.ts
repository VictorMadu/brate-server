import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    WithdrawCurrencyCommandRequest,
    WithdrawCurrencyCommandResponse,
} from './WithdrawCurrencyCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import WalletRepository from '../../../Repositories/Erate/ErateWalletRepository';
import WithdrawCurrencyManager from './WithdrawCurrencyManager';

export default class WithdrawCurrencyCommandHandler
    implements CommandHandler<WithdrawCurrencyCommandRequest, WithdrawCurrencyCommandResponse>
{
    constructor(
        private authTokenManager: AuthTokenManager,
        private dbManager: DbManager,
        private walletRepository: WalletRepository,
        private notificationRepository: NotificationRepository,
    ) {}

    async handle(
        commandRequest: WithdrawCurrencyCommandRequest,
    ): Promise<WithdrawCurrencyCommandResponse> {
        const withdrawCurrencyManager = new WithdrawCurrencyManager(commandRequest);

        await withdrawCurrencyManager.populateUserFromAuthManager(this.authTokenManager);
        await withdrawCurrencyManager.withdraw(
            this.dbManager,
            this.walletRepository,
            this.notificationRepository,
        );

        return withdrawCurrencyManager.getResponse();
    }
}
