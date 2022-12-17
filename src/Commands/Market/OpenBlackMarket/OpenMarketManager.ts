import BlackRate from '../../../Application/Common/Interfaces/Entities/BlackRate';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import PriceAlert from '../../../Application/Common/Interfaces/Entities/PriceAlert';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

import { openBlackMarketCommandRequest, openBlackMarketCommandResponse } from './OpenMarketCommand';

export default class OpenBlackMarketManager {
    private user = {} as Pick<User, 'userId'>;
    private market = {} as { bankRateId: string };

    constructor(private commandRequest: openBlackMarketCommandRequest) {}

    // TODO: Token manager in validator
    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);

        if (!tokenData.user.isBank) throw new Error();
        else this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(marketRepository: MarketRepository) {
        const openBlackMarketResult = await marketRepository.openBlackMarket({
            blackRate: {
                userId: this.user.userId,
                baseCurrencyId: this.commandRequest.baseCurrencyId,
                quotaCurrencyId: this.commandRequest.quotaCurrencyId,
                rate: this.commandRequest.rate,
            },
        });

        this.market.bankRateId = openBlackMarketResult.bankRateId;
    }

    async assertUpdateSuccessful() {}

    getResponse(): openBlackMarketCommandResponse {
        return this.market;
    }
}
