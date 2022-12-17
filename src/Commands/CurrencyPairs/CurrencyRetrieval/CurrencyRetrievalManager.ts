import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';

import {
    CurrencyRetrievalCommandRequest,
    CurrencyRetrievalCommandResponse,
} from './CurrencyRetrievalCommand';

export default class CurrencyRetrievalManager {
    private currencies: Currency[] = [];

    constructor(private commandRequest: CurrencyRetrievalCommandRequest) {}

    async populateFromPresistor(currenciesRepository: CurrenciesRepository) {
        this.currencies = await currenciesRepository.findMany();
    }

    getResponse(): CurrencyRetrievalCommandResponse {
        return this.currencies.map((currency) => {
            return {
                currencyId: currency.currencyId,
                abbrev: currency.abbrev,
                name: currency.name,
            };
        });
    }
}
