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
    ObtainDetailsCurrencyCommandRequest,
    ObtainDetailsCurrencyCommandResponse,
} from './ObtainDetailsCurrencyCommand';

export default class ObtainDetailsCurrencyManager {
    private wallet = {} as {
        userId: string;
        currencyIds?: number[];
        historySize: number;
        chainedDetails: {
            userId: string;
            currencyId: string;
            transactionIds: string[];
            amounts: string[];
            levels: number[];
            createdAts: Date[];
        }[];
    };

    constructor(private commandRequest: ObtainDetailsCurrencyCommandRequest) {
        this.wallet.currencyIds = this.commandRequest.currencyIds;
        this.wallet.historySize = this.commandRequest.historySize;
    }

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.wallet.userId = tokenData.user.userId;
    }

    async obtainDetails(dbManager: DbManager, walletRepository: WalletRepository) {
        dbManager.manage(() => this.ObtainDetailsAndPopulateData(walletRepository));
    }

    private async ObtainDetailsAndPopulateData(walletRepository: WalletRepository) {
        const result = await walletRepository.getChainedDetails(this.wallet);
        this.wallet.chainedDetails = result;
    }

    getResponse(): ObtainDetailsCurrencyCommandResponse {
        return this.wallet.chainedDetails;
    }
}
