import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    FavouritePairRetrievalCommandRequest,
    FavouritePairRetrievalCommandResponse,
} from './FavouritePairRetrievalCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import FavouritePairRetrievalManager from './FavouritePairRetrievalManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

export default class FavouritePairRetrievalCommandHandler
    implements
        CommandHandler<FavouritePairRetrievalCommandRequest, FavouritePairRetrievalCommandResponse>
{
    constructor(
        private currenciesRepository: CurrenciesRepository,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(
        commandRequest: FavouritePairRetrievalCommandRequest,
    ): Promise<FavouritePairRetrievalCommandResponse> {
        const favouritePairRetrievalManager = new FavouritePairRetrievalManager(commandRequest);

        await favouritePairRetrievalManager.populateUserFromAuthManager(this.authTokenManager);
        await favouritePairRetrievalManager.populateFromPresistor(this.currenciesRepository);
        return favouritePairRetrievalManager.getResponse();
    }
}
