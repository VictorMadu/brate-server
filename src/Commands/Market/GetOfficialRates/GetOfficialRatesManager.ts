import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';

import {
    GetOfficialRatesCommandRequest,
    GetOfficialRatesCommandResponse,
} from './GetOfficialRatesCommand';

export default class GetOfficialRatesManager {
    private rateData: {
        currencyId: number;
        rates: string[];
        createdAts: Date[];
        rowNos: number[];
    }[] = [];

    constructor(private commandRequest: GetOfficialRatesCommandRequest) {}

    async obtainRates(marketRepository: MarketRepository) {
        console.log(' this.rateData', this.rateData);
        this.rateData = await marketRepository.getOfficialMarketRate(this.commandRequest);
        console.log(' this.rateData', this.rateData);
    }

    getResponse(): GetOfficialRatesCommandResponse {
        return this.rateData;
    }
}
