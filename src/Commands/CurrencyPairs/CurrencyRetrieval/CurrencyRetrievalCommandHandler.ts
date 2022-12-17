import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    CurrencyRetrievalCommandRequest,
    CurrencyRetrievalCommandResponse,
} from './CurrencyRetrievalCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import CurrencyRetrievalManager from './CurrencyRetrievalManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

export default class CurrencyRetrievalCommandHandler
    implements CommandHandler<CurrencyRetrievalCommandRequest, CurrencyRetrievalCommandResponse>
{
    constructor(private currenciesRepository: CurrenciesRepository) {}

    async handle(
        commandRequest: CurrencyRetrievalCommandRequest,
    ): Promise<CurrencyRetrievalCommandResponse> {
        const currencyRetrievalManager = new CurrencyRetrievalManager(commandRequest);

        await currencyRetrievalManager.populateFromPresistor(this.currenciesRepository);
        return currencyRetrievalManager.getResponse();
    }
}
