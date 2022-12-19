import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import { SetAlertCommandRequest, SetAlertCommandResponse } from './SetAlertCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import SetAlertManager from './SetAlertManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

export default class SetAlertCommandHandler
    implements CommandHandler<SetAlertCommandRequest, SetAlertCommandResponse>
{
    constructor(
        private alertRepository: AlertRepository,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(commandRequest: SetAlertCommandRequest): Promise<SetAlertCommandResponse> {
        const setAlertManager = new SetAlertManager(commandRequest);

        console.log('commandRequest', commandRequest);
        await setAlertManager.populateUserFromAuthManager(this.authTokenManager);
        await setAlertManager.updatePresistor(this.alertRepository);
        await setAlertManager.assertUpdateSuccessful();

        return setAlertManager.getResponse();
    }
}
