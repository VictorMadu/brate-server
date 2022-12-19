import Currency from '../../../Application/Common/Interfaces/Entities/Currency';

import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

import { SetAlertCommandRequest, SetAlertCommandResponse } from './SetAlertCommand';

export default class SetAlertManager {
    private user = {} as Pick<User, 'userId'>;
    private rateAlert = {} as {
        rateAlertId: string;
        baseCurrencyId: string;
        quotaCurrencyId: string;
        targetRate: number;
        createdAt: Date;
        triggeredAt: Date;
        observedUserId: string;
        observedUserName: string;
    };

    constructor(private commandRequest: SetAlertCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        console.log(' this.user.userId =', this.user.userId);
        this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(alertRepository: AlertRepository) {
        if (this.commandRequest.official) {
            this.rateAlert = await alertRepository.setOfficialAlert({
                alert: {
                    ...this.commandRequest.official,
                    userId: this.user.userId,
                },
            });
        } else if (this.commandRequest.bank) {
            this.rateAlert = await alertRepository.setBankAlert({
                alert: {
                    ...this.commandRequest.bank,
                    userId: this.user.userId,
                },
            });
        }
    }

    async assertUpdateSuccessful() {}

    getResponse(): SetAlertCommandResponse {
        return this.rateAlert;
    }
}
