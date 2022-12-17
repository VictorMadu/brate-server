import axios from 'axios';
import Config from '../../../Application/Common/Config';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import {
    UpdateDbCurrenciesCommandRequest,
    UpdateDbCurrenciesCommandResponse,
} from './UpdateDbCurrenciesCommand';

type CurrencySymbol = string;
type CurrencyName = string;

interface CurrencyDetailsRes {
    success: boolean;
    symbols: Record<CurrencySymbol, CurrencyName>;
}

// TODO: IMplement cache in log file, timeout and retry
export default class UpdateDbCurrenciesManager {
    private currencies: { abbrev: string; name: string }[] = [];
    private isSuccessful = false;

    constructor(commandRequest: UpdateDbCurrenciesCommandRequest) {}

    async obtainCurrencies(config: Config) {
        const url = config.get('parallelRatesAPI.url');
        const key = config.get('parallelRatesAPI.keys')[0];

        const obtainedCurrencies = await axios
            .get(`${url}/symbols?access_key=${key}`)
            .then((response: { data: CurrencyDetailsRes }) => {
                console.log('response.data', response.data.symbols);
                return response.data.symbols;
            });

        console.log('obtainedCurrencies', obtainedCurrencies);

        const currencySymbols = Object.keys(obtainedCurrencies);

        for (let i = 0; i < currencySymbols.length; i++) {
            const symbol = currencySymbols[i];
            this.currencies[i] = { abbrev: symbol, name: obtainedCurrencies[symbol] };
        }
    }

    async persistCurrencies(currenciesRepository: CurrenciesRepository) {
        this.isSuccessful = await currenciesRepository.saveCurrencies({
            currencies: this.currencies,
        });
    }

    getResponse(): UpdateDbCurrenciesCommandResponse {
        return { isSuccessful: this.isSuccessful };
    }
}
