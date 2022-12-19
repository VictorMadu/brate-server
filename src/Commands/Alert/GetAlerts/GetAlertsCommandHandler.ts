import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import { GetAlertCommandRequest, GetAlertCommandResponse } from './GetAlertsCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import GetAlertManager from './GetAlertsAlertManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

export default class GetAlertsCommandHandler
    implements CommandHandler<GetAlertCommandRequest, GetAlertCommandResponse>
{
    constructor(private alertRepository: AlertRepository) {}

    async handle(commandRequest: GetAlertCommandRequest): Promise<GetAlertCommandResponse> {
        const getAlertManager = new GetAlertManager(commandRequest);

        await getAlertManager.updatePresistor(this.alertRepository);
        await getAlertManager.assertUpdateSuccessful();

        return getAlertManager.getResponse();
    }
}
