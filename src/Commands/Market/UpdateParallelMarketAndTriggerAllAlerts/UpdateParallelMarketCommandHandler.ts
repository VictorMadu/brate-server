import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    UpdateParallelMarketCommandRequest,
    UpdateParallelMarketCommandResponse,
} from './UpdateParallelMarketCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import UpdateParallelMarketManager from './UpdateParallelMarketManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';
import MarketRepository from '../../../Repositories/Erate/ErateMarketRepository';
import Config from '../../../Application/Common/Config';
import { OfficialRateGenerationStrategy } from '../../../Application/Common/ConfigEnums';

export default class UpdateParallelMarketCommandHandler
    implements
        CommandHandler<UpdateParallelMarketCommandRequest, UpdateParallelMarketCommandResponse>
{
    constructor(
        private config: Config,
        private marketRepository: MarketRepository,
        private currenciesRepository: CurrenciesRepository,
        private alertRepository: AlertRepository,
    ) {}

    async handle(
        commandRequest: UpdateParallelMarketCommandRequest,
    ): Promise<UpdateParallelMarketCommandResponse> {
        console.log('Running updating of currency');
        const updateParallelMarketManager = new UpdateParallelMarketManager(commandRequest);

        await this.handleRateGeneration(updateParallelMarketManager);

        await updateParallelMarketManager.triggerReachedAlerts(this.alertRepository);
        return updateParallelMarketManager.getResponse();
    }

    private handleRateGeneration(updateParallelMarketManager: UpdateParallelMarketManager) {
        const generationStrategy = this.config.get('officialRateGenerationStrategy');

        switch (generationStrategy) {
            case OfficialRateGenerationStrategy.API:
                return this.generateFromAPI(updateParallelMarketManager);
            case OfficialRateGenerationStrategy.SELF:
                return this.generateFromSelf(updateParallelMarketManager);
            case OfficialRateGenerationStrategy.SELF_WITH_INITIAL_API:
                return this.generateFromSelfButInitiallyFromAPI(updateParallelMarketManager);

            default:
                throw new Error();
        }
    }

    private async generateFromAPI(updateParallelMarketManager: UpdateParallelMarketManager) {
        await updateParallelMarketManager.populateKeyAndUrl(this.config);
        await updateParallelMarketManager.populateCurrencyDetails(this.currenciesRepository);
        await updateParallelMarketManager.getAndSaveCurrencyLatestRates(this.marketRepository);
    }

    private async generateFromSelf(updateParallelMarketManager: UpdateParallelMarketManager) {
        await updateParallelMarketManager.selfGenerateRates(this.marketRepository);
    }

    private async generateFromSelfButInitiallyFromAPI(
        updateParallelMarketManager: UpdateParallelMarketManager,
    ) {
        if (await updateParallelMarketManager.hasAllCurrenciesRate(this.marketRepository)) {
            return this.generateFromSelf(updateParallelMarketManager);
        } else {
            return this.generateFromAPI(updateParallelMarketManager);
        }
    }
}
