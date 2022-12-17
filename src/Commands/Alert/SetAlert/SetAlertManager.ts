import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import PriceAlert from '../../../Application/Common/Interfaces/Entities/PriceAlert';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

import { SetAlertCommandRequest, SetAlertCommandResponse } from './SetAlertCommand';

export default class SetAlertManager {
    private user = {} as Pick<User, 'userId'>;
    private alertsIds: Pick<PriceAlert, 'priceAlertId'>[] = [];

    constructor(private commandRequest: SetAlertCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(alertRepository: AlertRepository) {
        this.alertsIds = await Promise.all(
            this.commandRequest.pairs.map((pair) =>
                alertRepository.setAlert({
                    alert: {
                        userId: this.user.userId,
                        base: pair.base,
                        quota: pair.quota,
                        marketType: pair.marketType,
                        targetRate: pair.targetRate,
                    },
                }),
            ),
        );
    }

    async assertUpdateSuccessful() {}

    getResponse(): SetAlertCommandResponse {
        return this.alertsIds;
    }
}
