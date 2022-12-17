import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

import {
    FavouritePairRetrievalCommandRequest,
    FavouritePairRetrievalCommandResponse,
} from './FavouritePairRetrievalCommand';

export default class FavouritePairRetrievalManager {
    private user = {} as Pick<User, 'userId'>;
    private isFavourite: boolean[] = [];

    constructor(private commandRequest: FavouritePairRetrievalCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async populateFromPresistor(currenciesRepository: CurrenciesRepository) {
        this.isFavourite = await Promise.all(
            this.commandRequest.pairs.map(async (pair) => {
                const findResult = await currenciesRepository.findOneFavourite({
                    filter: { user: this.user, base: pair.base, quota: pair.quota },
                });
                return this.user.userId === findResult.userId;
            }),
        );
    }

    getResponse(): FavouritePairRetrievalCommandResponse {
        return this.isFavourite;
    }
}
