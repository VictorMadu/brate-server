import { Notification } from '../../../Application/Common/Interfaces/Entities/Notification';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import {
    NotificationRetrievalCommandRequest,
    NotificationRetrievalCommandResponse,
} from './NotificationRetrievalCommand';

export default class NotificationRetrievalManager {
    private user = {} as Pick<User, 'userId'>;
    private notifications: Notification[] = [];

    constructor(private commandRequest: NotificationRetrievalCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async populateFromPresistor(notificationRepository: NotificationRepository) {
        this.notifications = await notificationRepository.findMany({
            filter: {
                fromDateTime: this.commandRequest.dateTimeFrom,
                toDateTime: this.commandRequest.dateTimeTo,
                type: this.commandRequest.type,
                offset: this.commandRequest.pageOffset,
                size: this.commandRequest.pageCount,
                userId: this.user.userId,
            },
        });
    }

    getResponse(): NotificationRetrievalCommandResponse {
        return this.notifications.map((notification) => ({
            msg: notification.msg,
            notificationId: notification.notificationId,
            createdAt: notification.createdAt,
            type: notification.type,
        }));
    }
}
