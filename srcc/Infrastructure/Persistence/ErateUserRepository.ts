import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Users } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import { AtLeastOne } from 'ts-util-types';
import User from '../../Domain/Aggregates/User';
import NormalEntityDate from '../../Domain/ValueObjects/AppDates/NormalDate';
import { EmailExists, InsertFailed } from '../../Application/Common/Errors';
import UserRepository from '../../Application/Common/Interfaces/Repository/UserRepository';

interface RawUserModel {
    user_id: TableDataType.User['user_id'];
    email: TableDataType.User['email'];
    name: TableDataType.User['name'];
    hashed_pwd: TableDataType.User['password'];
    phone: TableDataType.User['phone'];
    created_at: TableDataType.User['created_at'];
}

export type InsertError = EmailExists | InsertFailed;

export default class ErateUserRepository implements UserRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async insertOne(inData: {
        user: Omit<User, 'userId' | 'createdAt'>;
    }): Promise<Pick<User, 'userId' | 'createdAt'>> {
        try {
            const result: QueryResult<Pick<RawUserModel, 'user_id' | 'created_at'>> =
                await this.runner.run(
                    ErateUserRepository.InsertQuery,
                    inData.user.email,
                    inData.user.name,
                    inData.user.hashPwd,
                    inData.user.phone,
                );

            const row = result.rows[0];
            if (row != null)
                return User.createFromStore({
                    userId: row.user_id,
                    createdAt: new NormalEntityDate(row.created_at),
                });

            throw new InsertFailed();
        } catch (error) {
            // TODO: EXplicitly set names of indexes, unique, constraints, etc
            if (error.constraint === 'users_email_key') {
                throw new EmailExists();
            } else {
                throw new InsertFailed();
            }
        }
    }

    async findOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
    }): Promise<Pick<User, 'userId' | 'email' | 'name' | 'phone' | 'createdAt' | 'hashPassword'>> {
        const result: QueryResult<TableDataType.User> = await this.runner.run(
            ErateUserRepository.GetQuery,
            inData.filter?.id,
            inData.filter?.email,
        );
        const row = result.rows[0];

        return row == null
            ? User.createFromStore({ isNull: true })
            : User.createFromStore({
                  userId: row.user_id,
                  email: row.email,
                  name: row.name,
                  hashPwd: row.password,
                  phone: row.phone,
                  createdAt: new NormalEntityDate(row.created_at),
              });
    }

    async updateOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
        user: Partial<Pick<User, 'name' | 'phone'>>;
    }): Promise<boolean> {
        const result = await this.runner.run(
            ErateUserRepository.UpdateQuery,
            inData.user.name,
            inData.user.phone,
            inData.filter.id,
            inData.filter.email,
        );

        return !!result.rowCount;
    }

    private static GetQuery = `
        SELECT 
            ${Users.user_id} user_id,
            ${Users.email} email,
            ${Users.name} name,
            ${Users.password} password,
            ${Users.phone} phone,
            ${Users.created_at} created_at
        FROM
            ${Users.$$NAME}
        WHERE  
            ${Users.user_id} = %L OR
            ${Users.email} = %L
    `;

    private static UpdateQuery = `
        UPDATE ${Users.$$NAME}
        SET 
            ${Users.name} = COALESCE(%L, ${Users.name}),
            ${Users.phone} = COALESCE(%L, ${Users.phone})
        WHERE  
            ${Users.user_id} = %L OR
            ${Users.email} = %L
    `;

    private static InsertQuery = `
        INSERT INTO ${Users.$$NAME}
        (
            ${Users.email},
            ${Users.name},
            ${Users.password},
            ${Users.phone}
        ) VALUES (
            %L,
            %L,
            %L,
            %L
        )
        RETURNING 
            ${Users.user_id} user_id,
            ${Users.created_at} created_at
    `;
}
