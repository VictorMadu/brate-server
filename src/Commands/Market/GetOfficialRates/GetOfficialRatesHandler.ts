import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import {
    GetOfficialRatesCommandRequest,
    GetOfficialRatesCommandResponse,
} from './GetOfficialRatesCommand';
import GetOfficialRatesManager from './GetOfficialRatesManager';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

export default class GetOfficialRatesCommandHandler
    implements CommandHandler<GetOfficialRatesCommandRequest, GetOfficialRatesCommandResponse>
{
    constructor(private marketRepository: MarketRepository) {}

    async handle(
        commandRequest: GetOfficialRatesCommandRequest,
    ): Promise<GetOfficialRatesCommandResponse> {
        const getOfficialRatesManager = new GetOfficialRatesManager(commandRequest);
        await getOfficialRatesManager.obtainRates(this.marketRepository);
        return getOfficialRatesManager.getResponse();
    }
}
