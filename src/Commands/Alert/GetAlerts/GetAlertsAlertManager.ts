import _ from 'lodash';
import Currency from '../../../Application/Common/Interfaces/Entities/Currency';
import PriceAlert from '../../../Application/Common/Interfaces/Entities/PriceAlert';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import NotificationRepository from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import AlertRepository from '../../../Repositories/Erate/ErateAlertRepository';

import { GetAlertCommandRequest, GetAlertCommandResponse } from './GetAlertsCommand';

export default class GetAlertManager {
    private user = {} as Pick<User, 'userId'>;
    private priceAlerts: PriceAlert[] = [];

    constructor(private commandRequest: GetAlertCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updatePresistor(alertRepository: AlertRepository) {
        this.priceAlerts = await alertRepository.getAlert({
            filter: {
                userId: this.user.userId,
                pairs: this.commandRequest.pairs,
                marketType: this.commandRequest.market,
                isTriggered: this.commandRequest.onlyTriggered,
                isNotTriggered: this.commandRequest.onlyUnTriggered,
                offset: this.commandRequest.pageOffset,
                size: this.commandRequest.pageCount,
                minCreatedAt:
                    this.commandRequest.minCreatedAt &&
                    _.floor(this.commandRequest.minCreatedAt?.getTime() / 1000),
                maxCreatedAt:
                    this.commandRequest.maxCreatedAt &&
                    _.floor(this.commandRequest.maxCreatedAt?.getTime() / 1000),
                minTriggeredAt:
                    this.commandRequest.minTriggeredAt &&
                    _.floor(this.commandRequest.minTriggeredAt?.getTime() / 1000),
                maxTriggeredAt:
                    this.commandRequest.maxTriggeredAt &&
                    _.floor(this.commandRequest.maxTriggeredAt?.getTime() / 1000),
            },
        });
    }

    async assertUpdateSuccessful() {}

    getResponse(): GetAlertCommandResponse {
        return this.priceAlerts;
    }
}
