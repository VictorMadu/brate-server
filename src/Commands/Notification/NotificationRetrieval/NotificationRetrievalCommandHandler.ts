import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    NotificationRetrievalCommandRequest,
    NotificationRetrievalCommandResponse,
} from './NotificationRetrievalCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import NotificationRetrievalManager from './NotificationRetrievalManager';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';

export default class NotificationRetrievalCommandHandler
    implements
        CommandHandler<NotificationRetrievalCommandRequest, NotificationRetrievalCommandResponse>
{
    constructor(private notificationRepository: NotificationRepository) {}

    async handle(
        commandRequest: NotificationRetrievalCommandRequest,
    ): Promise<NotificationRetrievalCommandResponse> {
        const notificationRetrievalManager = new NotificationRetrievalManager(commandRequest);

        await notificationRetrievalManager.populateFromPresistor(this.notificationRepository);
        return notificationRetrievalManager.getResponse();
    }
}
