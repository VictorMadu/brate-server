import BlackRate from '../../../Application/Common/Interfaces/Entities/BlackRate';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

import {
    CloseBlackMarketCommandRequest,
    CloseBlackMarketCommandResponse,
} from './CloseMarketCommand';

export default class CloseBlackMarketManager {
    private user = {} as Pick<User, 'userId'>;
    private market = {} as { bankRateId: string };

    constructor(private commandRequest: CloseBlackMarketCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);

        if (!tokenData.user.isBank) throw new Error();
        else this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(marketRepository: MarketRepository) {
        const closeBlackMarketResult = await marketRepository.closeBlackMarket({
            blackRate: {
                userId: this.user.userId,
                baseCurrencyId: this.commandRequest.baseCurrencyId,
                quotaCurrencyId: this.commandRequest.quotaCurrencyId,
            },
        });

        this.market.bankRateId = closeBlackMarketResult.bankRateId;
    }

    async assertUpdateSuccessful() {}

    getResponse(): CloseBlackMarketCommandResponse {
        return this.market;
    }
}
