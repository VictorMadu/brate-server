import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Notifications } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import { Notification } from '../../Application/Common/Interfaces/Entities/Notification';
import NotificationRepository, {
    Filter,
    NotificationType,
} from '../../Application/Common/Interfaces/Repositories/NotificationRepository';

type RawNotificationModel = TableDataType.Notification;

export default class ErateNotificationRepository implements NotificationRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async findMany(inData: { filter: Filter }): Promise<Notification[]> {
        const result: QueryResult<RawNotificationModel> = await this.runner.run(
            ErateNotificationRepository.GetQuery,
            inData.filter.userId,
            // inData.filter.type,
            // inData.filter.fromDateTime,
            // inData.filter.toDateTime,
            // inData.filter.offset,
            // inData.filter.size,
        );

        return _.map(result.rows, (row): Notification => {
            return {
                notificationId: row.notification_id,
                userId: row.user_id,
                msg: row.msg,
                type: row.type,
                createdAt: row.created_at,
            };
        });
    }

    async saveOne(inData: {
        notification: Pick<Notification, 'msg' | 'userId'> & { type: NotificationType };
    }): Promise<Pick<Notification, 'notificationId'>> {
        return (await this._saveMany({ notification: [inData.notification] }))[0];
    }
    
    async saveMany(inData: {
        notification: (Pick<Notification, 'msg' | 'userId'> & { type: NotificationType })[];
    }): Promise<Pick<Notification, 'notificationId'>[]> {
        return this._saveMany(inData);
    }

    async deleteOne(inData: { notification: Pick<Notification, 'userId' | 'notificationId'> }) {
        return this._deleteMany({ notifications: [inData.notification] });
    }

    async deleteMany(inData: { notifications: Pick<Notification, 'userId' | 'notificationId'>[] }) {
        return this._deleteMany(inData);
    }

    private async _saveMany(inData: {
        notification: (Pick<Notification, 'msg' | 'userId'> & { type: NotificationType })[];
    }): Promise<Pick<Notification, 'notificationId'>[]> {
        const result: QueryResult<RawNotificationModel> = await this.runner.run(
            ErateNotificationRepository.SaveQuery,
            inData.notification.map((row) => {
                return [row.userId, row.msg, row.type];
            }),
        );

        return _.map(result.rows, (row): Pick<Notification, 'notificationId'> => {
            return {
                notificationId: row.notification_id,
            };
        });
    }

    async _deleteMany(inData: {
        notifications: Pick<Notification, 'userId' | 'notificationId'>[];
    }) {
        const result = await this.runner.run(
            ErateNotificationRepository.DeleteQuery,
            inData.notifications.map((row) => [row.userId, row.notificationId]),
        );

        return !!result.rowCount;
    }

    private static GetQuery = `
        SELECT 
            ${Notifications.notification_id} notification_id,
            ${Notifications.user_id} user_id,
            ${Notifications.msg} msg,
            ${Notifications.type} type,
            ${Notifications.created_at} created_at
        FROM
            ${Notifications.$$NAME}
        WHERE  
            ${Notifications.user_id} = %L AND
            ${Notifications.deleted_at} IS NULL
      
    `;
    // (${Notifications.type} IS NULL OR ${Notifications.user_id} = %L) AND
    // (${Notifications.type} IS NULL OR ${Notifications.type} = %L) AND
    //         (${Notifications.created_at} IS NULL OR ${Notifications.created_at} >= %L) AND
    //         (${Notifications.created_at} IS NULL OR ${Notifications.created_at} <= %L) AND

    // OFFSET %L
    // LIMIT %L

    private static SaveQuery = `
        INSERT INTO ${Notifications.$$NAME}
            (
                ${Notifications.user_id} user_id,
                ${Notifications.msg} msg,
                ${Notifications.type} type
            )
        VALUES %L
        RETURNING ${Notifications.notification_id} AS id
    `;

    private static DeleteQuery = `
        WITH notification_to_delete AS (
            SELECT *
            FROM (VALUES %L)
            AS t(user_id, notification_id)
        )

        UPDATE 
            ${Notifications.$$NAME}
        SET 
            ${Notifications.deleted_at} = NOW()
        WHERE ${Notifications.notification_id} IN (
            SELECT 
                ${Notifications.notification_id}
            FROM
                ${Notifications.$$NAME} AS t1
            LEFT JOIN 
                notification_to_delete AS t2
            ON 
                t1.${Notifications.user_id} = t2.user_id AND
                t1.${Notifications.notification_id} = t2.notification_id
        )
    `;
}
