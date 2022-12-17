import Config from '../../../Application/Common/Config';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import {
    UpdateDbCurrenciesCommandRequest,
    UpdateDbCurrenciesCommandResponse,
} from './UpdateDbCurrenciesCommand';
import UpdateDbCurrenciesManager from './UpdateDbCurrenciesManager';

export default class UpdateDbCurrenciesCommandHandler
    implements CommandHandler<UpdateDbCurrenciesCommandRequest, UpdateDbCurrenciesCommandResponse>
{
    constructor(private currenciesRepository: CurrenciesRepository, private config: Config) {}

    async handle(
        commandRequest: UpdateDbCurrenciesCommandRequest,
    ): Promise<UpdateDbCurrenciesCommandResponse> {
        const updateDbCurrenciesManager = new UpdateDbCurrenciesManager(commandRequest);

        await updateDbCurrenciesManager.obtainCurrencies(this.config);
        await updateDbCurrenciesManager.persistCurrencies(this.currenciesRepository);

        return updateDbCurrenciesManager.getResponse();
    }
}
