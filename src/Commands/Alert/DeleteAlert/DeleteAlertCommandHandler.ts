import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import { DeleteAlertCommandRequest, DeleteAlertCommandResponse } from './DeleteAlertCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import DeleteAlertManager from './DeleteAlertManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import CurrenciesRepository from '../../../Repositories/Erate/ErrateCurrencyPairRepository';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

export default class DeleteAlertCommandHandler
    implements CommandHandler<DeleteAlertCommandRequest, DeleteAlertCommandResponse>
{
    constructor(private alertRepository: AlertRepository) {}

    async handle(commandRequest: DeleteAlertCommandRequest): Promise<DeleteAlertCommandResponse> {
        const deleteAlertManager = new DeleteAlertManager(commandRequest);

        await deleteAlertManager.updatePresistor(this.alertRepository);
        await deleteAlertManager.assertUpdateSuccessful();

        return deleteAlertManager.getResponse();
    }
}
