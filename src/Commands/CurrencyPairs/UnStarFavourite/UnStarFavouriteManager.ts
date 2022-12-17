import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

import {
    UnStarFavouriteCommandRequest,
    UnStarFavouriteCommandResponse,
} from './UnStarFavouriteCommand';

export default class StarFavouriteManager {
    private currencies: Currency[] = [];
    private user = {} as Pick<User, 'userId'>;

    constructor(private commandRequest: UnStarFavouriteCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(currenciesRepository: CurrenciesRepository) {
        await currenciesRepository.unSetFavourite({
            pairFavourite: {
                userId: this.user.userId,
                base: this.commandRequest.base,
                quota: this.commandRequest.quota,
            },
        });
    }

    async assertUpdateSuccessful() {}

    getResponse(): UnStarFavouriteCommandResponse {}
}
