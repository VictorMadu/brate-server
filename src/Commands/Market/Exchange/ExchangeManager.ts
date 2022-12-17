import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import NotificationRepository, {
    NotificationType,
} from '../../../Application/Common/Interfaces/Repositories/NotificationRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import TradeRepository, { Operation } from '../../../Repositories/Erate/ErateTradeRepository';

import { ExchangeCommandRequest, ExchangeCommandResponse } from './ExchangeCommand';

export default class ExchangeManager {
    private exchange = {
        base: {},
        quota: {},
        buyer: { base: {}, quota: {} },
        seller: { base: {}, quota: {} },
    } as {
        tradeId: string;
        blackTradeId: string;
        base: {
            currencyId: string;
            currencyAbbrev: string;
        };
        quota: {
            currencyId: string;
            currencyAbbrev: string;
        };
        baseAmount: string;
        rate: string;
        buyer: {
            userId: string;
            userName: string;
            base: { transactionId: string; amountLeft: string; amountDebited: string };
            quota: { transactionId: string; amountLeft: string; amountCredited: string };
        };
        seller: {
            userId: string;
            userName: string;
            base: { transactionId: string; amountLeft: string; amountCredited: string };
            quota: { transactionId: string; amountLeft: string; amountDebited: string };
        };
    };

    constructor(private commandRequest: ExchangeCommandRequest) {
        this.populateFromCommandRequest();
    }

    async populateFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.exchange.buyer.userId = tokenData.user.userId;
    }

    async populateExchangeDetails(tradeRepository: TradeRepository) {
        const findResult = await tradeRepository.obtainDetails({
            blackMarketTradeId: this.exchange.blackTradeId,
            buyerUserId: this.exchange.buyer.userId,
        });

        this.exchange.buyer.userId = findResult.buyerUserId;
        this.exchange.buyer.userName = findResult.buyerUserName;
        this.exchange.seller.userId = findResult.sellerUserId;
        this.exchange.seller.userName = findResult.sellerUserName;
        this.exchange.base.currencyId = findResult.baseCurrencyId;
        this.exchange.base.currencyAbbrev = findResult.baseCurrencyAbbrev;
        this.exchange.quota.currencyId = findResult.quotaCurrencyId;
        this.exchange.quota.currencyAbbrev = findResult.quotaCurrencyAbrev;
        this.exchange.rate = findResult.rate;
    }

    async exchangeAndNotify(
        dbManager: DbManager,
        tradeRepository: TradeRepository,
        notificationRepository: NotificationRepository,
    ) {
        dbManager.manage(
            () => this.debitBuyer(tradeRepository),
            () => this.debitSeller(tradeRepository),
            () => this.creditBuyer(tradeRepository),
            () => this.creditSeller(tradeRepository),

            () => this.notifyBuyerOfBaseDebit(notificationRepository),
            () => this.notifySellerOfQuotaCredit(notificationRepository),
            () => this.notifySellerOfQuotaDebit(notificationRepository),
            () => this.notifyBuyerOfBaseCredit(notificationRepository),

            () => this.saveTradeDetails(tradeRepository),
        );
    }

    private populateFromCommandRequest() {
        this.exchange.blackTradeId = this.commandRequest.blackTradeId;
    }

    private async debitBuyer(tradeRepository: TradeRepository) {
        const findResult = await tradeRepository.updateBalance({
            userId: this.exchange.buyer.userId,
            currencyId: this.exchange.base.currencyId,
            amountToMoveInBaseCurrency: this.exchange.baseAmount,
            multipler: '1',
            operation: Operation.DEBIT,
        });

        this.exchange.buyer.base.transactionId = findResult.transactionId;
        this.exchange.buyer.base.amountDebited = findResult.amountMoved;
        this.exchange.buyer.base.amountLeft = findResult.amountLeft;
    }

    private async debitSeller(tradeRepository: TradeRepository) {
        const findResult = await tradeRepository.updateBalance({
            userId: this.exchange.seller.userId,
            currencyId: this.exchange.quota.currencyId,
            amountToMoveInBaseCurrency: this.exchange.baseAmount,
            multipler: this.exchange.rate,
            operation: Operation.DEBIT,
        });

        this.exchange.seller.quota.transactionId = findResult.transactionId;
        this.exchange.seller.quota.amountDebited = findResult.amountMoved;
        this.exchange.seller.quota.amountLeft = findResult.amountLeft;
    }

    private async creditBuyer(tradeRepository: TradeRepository) {
        const findResult = await tradeRepository.updateBalance({
            userId: this.exchange.buyer.userId,
            currencyId: this.exchange.quota.currencyId,
            amountToMoveInBaseCurrency: this.exchange.baseAmount,
            multipler: this.exchange.rate,
            operation: Operation.CREDIT,
        });

        this.exchange.buyer.quota.transactionId = findResult.transactionId;
        this.exchange.buyer.quota.amountCredited = findResult.amountMoved;
        this.exchange.buyer.quota.amountLeft = findResult.amountLeft;
    }

    private async creditSeller(tradeRepository: TradeRepository) {
        const findResult = await tradeRepository.updateBalance({
            userId: this.exchange.seller.userId,
            currencyId: this.exchange.base.currencyId,
            amountToMoveInBaseCurrency: this.exchange.baseAmount,
            multipler: '1',
            operation: Operation.CREDIT,
        });

        this.exchange.seller.base.transactionId = findResult.transactionId;
        this.exchange.seller.base.amountCredited = findResult.amountMoved;
        this.exchange.seller.base.amountLeft = findResult.amountLeft;
    }

    private async notifyBuyerOfBaseDebit(notificationRepository: NotificationRepository) {
        const amountDebited = this.exchange.buyer.base.amountDebited;
        const currencyAbbrev = this.exchange.base.currencyAbbrev;
        const receiverName = this.exchange.seller.userName;

        await notificationRepository.saveOne({
            notification: {
                type: NotificationType.CURRENCIES_EXCHANGED,
                msg: `${amountDebited} ${currencyAbbrev} was transferred to ${receiverName}`,
                userId: this.exchange.buyer.userId,
            },
        });
    }

    private async notifySellerOfQuotaDebit(notificationRepository: NotificationRepository) {
        const amountDebited = this.exchange.seller.quota.amountDebited;
        const currencyAbbrev = this.exchange.quota.currencyAbbrev;
        const receiverName = this.exchange.buyer.userName;

        await notificationRepository.saveOne({
            notification: {
                type: NotificationType.CURRENCIES_EXCHANGED,
                msg: `${amountDebited} ${currencyAbbrev} was transferred to ${receiverName}`,
                userId: this.exchange.seller.userId,
            },
        });
    }

    private async notifyBuyerOfBaseCredit(notificationRepository: NotificationRepository) {
        const amountCredited = this.exchange.buyer.quota.amountCredited;
        const currencyAbbrev = this.exchange.quota.currencyAbbrev;
        const senderName = this.exchange.seller.userName;

        await notificationRepository.saveOne({
            notification: {
                type: NotificationType.CURRENCIES_EXCHANGED,
                msg: `${amountCredited} ${currencyAbbrev} was received from ${senderName}`,
                userId: this.exchange.buyer.userId,
            },
        });
    }

    private async notifySellerOfQuotaCredit(notificationRepository: NotificationRepository) {
        const amountCredited = this.exchange.buyer.quota.amountCredited;
        const currencyAbbrev = this.exchange.quota.currencyAbbrev;
        const senderName = this.exchange.seller.userName;

        await notificationRepository.saveOne({
            notification: {
                type: NotificationType.CURRENCIES_EXCHANGED,
                msg: `${amountCredited} ${currencyAbbrev} was received from ${senderName}`,
                userId: this.exchange.buyer.userId,
            },
        });
    }

    private async saveTradeDetails(tradeRepository: TradeRepository) {
        const result = await tradeRepository.saveTrade({
            blackRateId: this.exchange.blackTradeId,
            buyerUserId: this.exchange.buyer.userId,
            transaction: {
                fromBaseId: this.exchange.buyer.base.transactionId,
                toBaseId: this.exchange.seller.base.transactionId,
                fromQuotaId: this.exchange.seller.quota.transactionId,
                toQuotaId: this.exchange.buyer.quota.transactionId,
            },
        });
        this.exchange.tradeId = result.tradeId;
    }

    getResponse(): ExchangeCommandResponse {
        return {
            tradeId: this.exchange.tradeId,
        };
    }
}
