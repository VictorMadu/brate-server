import _ from 'lodash';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

import { GetAlertCommandRequest, GetAlertCommandResponse } from './GetAlertsCommand';

export default class GetAlertManager {
    private user = {} as Pick<User, 'userId'>;
    private priceAlerts: {
        rateAlertId: string;
        baseCurrencyId: string;
        quotaCurrencyId: string;
        targetRate: number;
        createdAt: Date;
        triggeredAt: Date;
        observedUserId: string;
        observedUserName: string;
    }[] = [];

    constructor(private commandRequest: GetAlertCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(alertRepository: AlertRepository) {
        this.priceAlerts = await alertRepository.getAAlllert({
            filter: {
                userId: this.user.userId,
                baseIds: this.commandRequest.baseCurrencyId,
                quotaIds: this.commandRequest.quotaCurrencyId,
                rateAlertIds: this.commandRequest.rateAlertIds,
                unTriggeredOnly: this.commandRequest.unTriggeredOnly,
                triggeredOnly: this.commandRequest.triggeredOnly,
                offset: this.commandRequest.pageOffset,
                limit: this.commandRequest.pageCount,
                minCreatedAt: this.commandRequest.minCreatedAt,
                maxCreatedAt: this.commandRequest.maxCreatedAt,
                minTriggeredAt: this.commandRequest.minTriggeredAt,
                maxTriggeredAt: this.commandRequest.minCreatedAt,
            },
        });
    }

    async assertUpdateSuccessful() {}

    getResponse(): GetAlertCommandResponse {
        return this.priceAlerts;
    }
}
