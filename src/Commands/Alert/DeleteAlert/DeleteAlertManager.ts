import Currency from '../../../Application/Common/Interfaces/Entities/Currency';

import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

import { DeleteAlertCommandRequest, DeleteAlertCommandResponse } from './DeleteAlertCommand';

export default class DeleteAlertManager {
    private user = {} as Pick<User, 'userId'>;
    private isSuccessful = false;

    constructor(private commandRequest: DeleteAlertCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(alertRepository: AlertRepository) {
        if (this.commandRequest.official) {
            this.isSuccessful = await alertRepository.deleteOfficialAlert({
                alert: {
                    ...this.commandRequest.official,
                    userId: this.user.userId,
                },
            });
        } else if (this.commandRequest.bank) {
            this.isSuccessful = await alertRepository.deleteOfficialAlert({
                alert: {
                    ...this.commandRequest.bank,
                    userId: this.user.userId,
                },
            });
        }
    }

    async assertUpdateSuccessful() {}

    getResponse(): DeleteAlertCommandResponse {
        return { isSuccessful: this.isSuccessful };
    }
}
