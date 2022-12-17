import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository, {
    NotificationType,
} from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import WalletRepository from '../../../Repositories/Erate/ErateWalletRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

import { FundCurrencyCommandRequest, FundCurrencyCommandResponse } from './FundCurrencyCommand';

export default class FundCurrencyManager {
    private wallet = {} as {
        userId: string;
        currencyId: number;
        amountToFund: string;
        headTransactionId: string;
        amountAvailable: string;
        currencyAbbrev: string;
    };

    constructor(private commandRequest: FundCurrencyCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.wallet.userId = tokenData.user.userId;
    }

    async fund(
        dbManager: DbManager,
        walletRepository: WalletRepository,
        notificationRepository: NotificationRepository,
    ) {
        dbManager.manage(
            () => this.fundAndPopulateData(walletRepository),
            () => this.notifyFunded(notificationRepository),
        );
    }

    private async fundAndPopulateData(walletRepository: WalletRepository) {
        const result = await walletRepository.fund(this.wallet);

        this.wallet.headTransactionId = result.headTransactionId;
        this.wallet.amountAvailable = result.amountAvailable;
        this.wallet.currencyAbbrev = result.currencyAbbrev;
    }

    private async notifyFunded(notificationRepository: NotificationRepository) {
        const amount = this.wallet.amountToFund;
        const currencyAbbrev = this.wallet.currencyAbbrev;

        notificationRepository.saveOne({
            notification: {
                msg: `You funded your wallet with ${amount} ${currencyAbbrev}`,
                userId: this.wallet.userId,
                type: NotificationType.WALLET_FUNDED,
            },
        });
    }

    getResponse(): FundCurrencyCommandResponse {
        return {
            amountAvailable: this.wallet.amountAvailable,
        };
    }
}
