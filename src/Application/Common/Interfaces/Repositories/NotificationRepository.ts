import _ from 'lodash';
import { Notification } from '../Entities/Notification';

export interface Filter {
    fromDateTime: Date | null;
    toDateTime: Date | null;
    type: 'P' | 'F' | 'T' | null;
    offset: number;
    size: number;
    userId: string;
}
export enum NotificationType {
    ALERT_TRIGGERED = 'P',
    CURRENCIES_EXCHANGED = 'T',
    WALLET_FUNDED = 'F',
    WITHDRAWED = 'F',
}

export default interface NotificationRepository {
    findMany(inData: { filter: Partial<Filter> }): Promise<Notification[]>;
    saveOne(inData: {
        notification: { msg: string; userId: string; type: NotificationType };
    }): Promise<Pick<Notification, 'notificationId'>>;
    saveMany(inData: {
        notification: { msg: string; userId: string; type: NotificationType }[];
    }): Promise<Pick<Notification, 'notificationId'>[]>;

    deleteOne(inData: {
        notification: Pick<Notification, 'userId' | 'notificationId'>;
    }): Promise<boolean>;
    deleteMany(inData: {
        notifications: Pick<Notification, 'userId' | 'notificationId'>[];
    }): Promise<boolean>;
}
