import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    UnStarFavouriteCommandRequest,
    UnStarFavouriteCommandResponse,
} from './UnStarFavouriteCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import UnStarFavouriteManager from './UnStarFavouriteManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

export default class StarFavouriteCommandHandler
    implements CommandHandler<UnStarFavouriteCommandRequest, UnStarFavouriteCommandResponse>
{
    constructor(private currenciesRepository: CurrenciesRepository) {}

    async handle(
        commandRequest: UnStarFavouriteCommandRequest,
    ): Promise<UnStarFavouriteCommandResponse> {
        const unStarFavouriteManager = new UnStarFavouriteManager(commandRequest);

        await unStarFavouriteManager.updatePresistor(this.currenciesRepository);
        await unStarFavouriteManager.assertUpdateSuccessful();

        return unStarFavouriteManager.getResponse();
    }
}
