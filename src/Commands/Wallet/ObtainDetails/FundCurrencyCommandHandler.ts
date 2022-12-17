import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    ObtainDetailsCurrencyCommandRequest,
    ObtainDetailsCurrencyCommandResponse,
} from './ObtainDetailsCurrencyCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import ObtainDetailsCurrencyManager from './ObtainDetailsCurrencyManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import WalletRepository from '../../../Repositories/Erate/ErateWalletRepository';

export default class ObtainDetailsCurrencyCommandHandler
    implements
        CommandHandler<ObtainDetailsCurrencyCommandRequest, ObtainDetailsCurrencyCommandResponse>
{
    constructor(
        private authTokenManager: AuthTokenManager,
        private dbManager: DbManager,
        private walletRepository: WalletRepository,
    ) {}

    async handle(
        commandRequest: ObtainDetailsCurrencyCommandRequest,
    ): Promise<ObtainDetailsCurrencyCommandResponse> {
        const obtainDetailsCurrencyManager = new ObtainDetailsCurrencyManager(commandRequest);

        await obtainDetailsCurrencyManager.populateUserFromAuthManager(this.authTokenManager);
        await obtainDetailsCurrencyManager.obtainDetails(this.dbManager, this.walletRepository);

        return obtainDetailsCurrencyManager.getResponse();
    }
}
