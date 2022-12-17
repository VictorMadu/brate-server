import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import PriceAlert from '../../../Application/Common/Interfaces/Entities/PriceAlert';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

import { DeleteAlertCommandRequest, DeleteAlertCommandResponse } from './DeleteAlertCommand';

export default class DeleteAlertManager {
    private user = {} as Pick<User, 'userId'>;

    constructor(private commandRequest: DeleteAlertCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(alertRepository: AlertRepository) {
        await Promise.all(
            this.commandRequest.priceAlertIds.map((id) =>
                alertRepository.deleteAlert({
                    alert: { userId: this.user.userId, priceAlertId: id },
                }),
            ),
        );
    }

    async assertUpdateSuccessful() {}

    getResponse(): DeleteAlertCommandResponse {}
}
