import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository, {
    NotificationType,
} from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import WalletRepository from '../../../Repositories/Erate/ErateWalletRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

import {
    WithdrawCurrencyCommandRequest,
    WithdrawCurrencyCommandResponse,
} from './WithdrawCurrencyCommand';

export default class WithdrawCurrencyManager {
    private wallet = {} as {
        userId: string;
        currencyId: number;
        amountToWithdraw: string;
        headTransactionId: string;
        amountAvailable: string;
        currencyAbbrev: string;
    };

    constructor(private commandRequest: WithdrawCurrencyCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.wallet.userId = tokenData.user.userId;
    }

    async withdraw(
        dbManager: DbManager,
        walletRepository: WalletRepository,
        notificationRepository: NotificationRepository,
    ) {
        dbManager.manage(
            () => this.WithdrawAndPopulateData(walletRepository),
            () => this.notifyWithdrawed(notificationRepository),
        );
    }

    private async WithdrawAndPopulateData(walletRepository: WalletRepository) {
        const result = await walletRepository.withdraw(this.wallet);

        this.wallet.headTransactionId = result.headTransactionId;
        this.wallet.amountAvailable = result.amountAvailable;
        this.wallet.currencyAbbrev = result.currencyAbbrev;
    }

    private async notifyWithdrawed(notificationRepository: NotificationRepository) {
        const amount = this.wallet.amountToWithdraw;
        const currencyAbbrev = this.wallet.currencyAbbrev;

        notificationRepository.saveOne({
            notification: {
                msg: `You Withdrawed your wallet with ${amount} ${currencyAbbrev}`,
                userId: this.wallet.userId,
                type: NotificationType.WITHDRAWED,
            },
        });
    }

    getResponse(): WithdrawCurrencyCommandResponse {
        return {
            amountAvailable: this.wallet.amountAvailable,
        };
    }
}
