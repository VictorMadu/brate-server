import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Notifications } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';

type RawNotificationModel = TableDataType.Notification;

export interface UserModel {
    id: string;
}

export interface Filter {
    fromTime: Date | null;
    toTime: Date | null;
    type: 'P' | 'F' | 'T' | null;
    offset: number;
    size: number;
}

export interface NotificationModel {
    id: string;
    userId: string;
    msg: string;
    type: 'P' | 'F' | 'T';
    createdAt: Date;
}

export default class NotificationRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async findMany(inData: { userModel: UserModel; filter: Filter }): Promise<NotificationModel[]> {
        const result: QueryResult<RawNotificationModel> = await this.runner.run(
            NotificationRepository.GetQuery,
            inData.userModel.id,
            inData.filter.type,
            inData.filter.fromTime,
            inData.filter.toTime,
            inData.filter.offset,
            inData.filter.size,
        );

        return _.map(result.rows, (row): NotificationModel => {
            return {
                id: row.notification_id,
                userId: row.user_id,
                msg: row.msg,
                type: row.type,
                createdAt: row.created_at,
            };
        });
    }

    async saveOne(inData: {
        notificationModel: Omit<NotificationModel, 'id'>;
    }): Promise<Pick<NotificationModel, 'id'>> {
        return (await this._saveMany(inData))[0];
    }

    async saveMany(inData: {
        notificationModel: Omit<NotificationModel, 'id'>;
    }): Promise<Pick<NotificationModel, 'id'>[]> {
        return this._saveMany(inData);
    }

    async deleteOne(inData: { notificationModel: Pick<NotificationModel, 'id'> }) {
        return this._deleteMany({ notificationModel: [inData.notificationModel] });
    }

    async deleteMany(inData: { notificationModel: Pick<NotificationModel, 'id'>[] }) {
        return this._deleteMany(inData);
    }

    private async _saveMany(inData: {
        notificationModel: Omit<NotificationModel, 'id'>;
    }): Promise<Pick<NotificationModel, 'id'>[]> {
        const result: QueryResult<RawNotificationModel> = await this.runner.run(
            NotificationRepository.SaveQuery,
            [
                [
                    inData.notificationModel.userId,
                    inData.notificationModel.msg,
                    inData.notificationModel.type,
                    inData.notificationModel.createdAt,
                ],
            ],
        );

        return _.map(result.rows, (row): Pick<NotificationModel, 'id'> => {
            return {
                id: row.notification_id,
            };
        });
    }

    async _deleteMany(inData: { notificationModel: Pick<NotificationModel, 'id'>[] }) {
        await this.runner.run(
            NotificationRepository.DeleteQuery,
            inData.notificationModel.map((model) => model.id),
        );
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
            (${Notifications.type} IS NULL OR ${Notifications.type} = %L) AND
            (${Notifications.created_at} IS NULL OR ${Notifications.created_at} >= %L) AND
            (${Notifications.created_at} IS NULL OR ${Notifications.created_at} <= %L) AND
            ${Notifications.deleted_at} IS NULL
        OFFSET %L
        LIMIT %L
    `;

    private static SaveQuery = `
        INSERT INTO ${Notifications.$$NAME}
            (
                ${Notifications.user_id} user_id,
                ${Notifications.msg} msg,
                ${Notifications.type} type,
                ${Notifications.created_at} created_at
            )
        VALUES %L
        RETURNING ${Notifications.notification_id} AS id
    `;

    private static DeleteQuery = `
        UPDATE ${Notifications.$$NAME}
        SET 
            ${Notifications.deleted_at} = %L
        WHERE 
            ${Notifications.notification_id} IN (%L) OR 
            (
                ${Notifications.notification_id} IS NOT NULL AND
                ${Notifications.notification_id} IN (%s)
            )
    `;
}
