import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import { StarFavouriteCommandRequest, StarFavouriteCommandResponse } from './StarFavouriteCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import StarFavouriteManager from './StarFavouriteManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

export default class StarFavouriteCommandHandler
    implements CommandHandler<StarFavouriteCommandRequest, StarFavouriteCommandResponse>
{
    constructor(private currenciesRepository: CurrenciesRepository) {}

    async handle(
        commandRequest: StarFavouriteCommandRequest,
    ): Promise<StarFavouriteCommandResponse> {
        const starFavouriteManager = new StarFavouriteManager(commandRequest);

        await starFavouriteManager.updatePresistor(this.currenciesRepository);
        await starFavouriteManager.assertUpdateSuccessful();

        return starFavouriteManager.getResponse();
    }
}
