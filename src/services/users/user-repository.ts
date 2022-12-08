import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Users } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import { AtLeastOne } from 'ts-util-types';

interface RawUserModel {
    user_id: TableDataType.User['user_id'];
    email: TableDataType.User['email'];
    name: TableDataType.User['name'];
    hashed_pwd: TableDataType.User['password'];
    phone: TableDataType.User['phone'];
    created_at: TableDataType.User['created_at'];
}

export default class UserRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async insertOne(inData: {
        userModel: Omit<UserModel, 'id' | 'createdAt'>;
    }): Promise<Pick<UserModel, 'id' | 'createdAt'>> {
        try {
            const result: QueryResult<Pick<RawUserModel, 'user_id' | 'created_at'>> =
                await this.runner.run(
                    UserRepository.InsertQuery,
                    inData.userModel.email,
                    inData.userModel.name,
                    inData.userModel.hashedPwd,
                    inData.userModel.phone,
                );

            const row = result.rows[0];
            return row == null
                ? new NullUserModel(ErrorCode.FAILED_SAVE)
                : {
                      id: row.user_id,
                      createdAt: row.created_at,
                  };
        } catch (error) {
            // TODO: EXplicitly set names of indexes, unique, constraints, etc
            if (error.constraint === 'users_email_key') {
                return new NullUserModel(ErrorCode.EMAIL_EXISTS);
            } else {
                return new NullUserModel(ErrorCode.FAILED_SAVE);
            }
        }
    }

    async findOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
    }): Promise<UserModel> {
        const result: QueryResult<TableDataType.User> = await this.runner.run(
            UserRepository.GetQuery,
            inData.filter?.id,
            inData.filter?.email,
        );
        const row = result.rows[0];

        return row == null
            ? new NullUserModel(ErrorCode.NOT_FOUND)
            : {
                  id: row.user_id,
                  email: row.email,
                  name: row.name,
                  hashedPwd: row.password,
                  phone: row.phone,
                  createdAt: row.created_at,
              };
    }

    async updateOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
        userModel: Partial<Pick<UserModel, 'name' | 'phone'>>;
    }): Promise<boolean> {
        const result = await this.runner.run(
            UserRepository.UpdateQuery,
            inData.userModel.name,
            inData.userModel.phone,
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
            ${Users.password} hashed_pwd,
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
