import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Users } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../Database/Erate/TableDataTypes';
import _ from 'lodash';
import { AtLeastOne } from 'ts-util-types';
import UserRepository from '../../Application/Common/Interfaces/Repositories/UserRepository';
import { User } from '../../Application/Common/Interfaces/Entities/User';
import * as DatabaseError from '../../Application/Common/Errors/Database';
import { UserVerifications } from '../../Database/Erate/Tables';
import { UserVerification } from '../../Application/Common/Interfaces/Entities/UserVerification';

interface RawUserModel {
    user_id: TableDataType.User['user_id'];
    email: TableDataType.User['email'];
    name: TableDataType.User['name'];
    hashed_pwd: TableDataType.User['password'];
    phone: TableDataType.User['phone'];
    created_at: TableDataType.User['created_at'];
    is_bank: TableDataType.User['is_bank'];
}

export default class ErateUserRepository implements UserRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async insertUserAndVerification(inData: {
        user: Pick<User, 'email' | 'name' | 'phone' | 'hashedPassword' | 'isBank'> &
            Pick<UserVerification, 'hashedOTP'>;
    }): Promise<
        Pick<User, 'userId' | 'createdAt'> &
            Pick<UserVerification, 'verificationId'> & { verifiedAt: null }
    > {
        const { user } = inData;
        try {
            const result: QueryResult<{
                user_id: string;
                verification_id: string;
                created_at: Date;
                verified_at: null;
            }> = await this.runner.run(
                ErateUserRepository.InsertQuery,
                user.email,
                user.name,
                user.hashedPassword,
                user.phone,
                user.hashedOTP,
                user.isBank,
            );

            const row = result.rows[0];

            return {
                userId: row.user_id,
                createdAt: row.created_at,
                verificationId: row.verification_id,
                verifiedAt: row.verified_at,
            };
        } catch (error) {
            console.log('ERROR', error);
            switch (
                error.constraint // TODO: EXplicitly set names of indexes, unique, constraints, etc
            ) {
                case 'users_email_key':
                    throw new DatabaseError.EmailExists();

                default:
                    throw new DatabaseError.FailedSave();
            }
        }
    }

    async findOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
    }): Promise<
        Pick<
            User,
            'userId' | 'email' | 'name' | 'phone' | 'createdAt' | 'hashedPassword' | 'isBank'
        >
    > {
        console.log('Hellow', inData.filter.id, inData.filter.email);
        const result: QueryResult<RawUserModel> = await this.runner.run(
            ErateUserRepository.GetQuery,
            inData.filter.id ?? null,
            inData.filter.email ?? null,
        );
        const row = result.rows[0];

        return {
            userId: row.user_id,
            email: row.email,
            name: row.name,
            hashedPassword: row.hashed_pwd,
            phone: row.phone,
            createdAt: row.created_at,
            isBank: row.is_bank,
        };
    }

    async updateOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
        user: Partial<Pick<User, 'name' | 'phone'>>;
    }): Promise<boolean> {
        const { user, filter } = inData;

        const result = await this.runner.run(
            ErateUserRepository.UpdateQuery,
            user.name,
            user.phone,
            filter.id,
            filter.email,
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
            ${Users.created_at} created_at,
            ${Users.is_bank} is_bank
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
        WITH in_data AS (
            SELECT * FROM (VALUES (%L, %L, %L, %L, %L, (%L)::BOOLEAN)) AS t(email, name, hashed_pwd, phone, hashed_otp, is_bank)
        ),
        inserted_user AS (
            INSERT INTO ${Users.$$NAME}
            (
                ${Users.email},
                ${Users.name},
                ${Users.password},
                ${Users.phone},
                ${Users.is_bank}
            ) 
            SELECT email, name, hashed_pwd, phone, is_bank
            FROM in_data
            RETURNING 
                ${Users.user_id} user_id,
                ${Users.created_at} created_at
        ),
        inserted_verification AS (
            INSERT INTO ${UserVerifications.$$NAME}
            (
                ${UserVerifications.user_id},
                ${UserVerifications.otp},
                ${UserVerifications.no_of_tries},
                ${UserVerifications.created_at},
                ${UserVerifications.verified_at}
            ) 
            VALUES (
                (SELECT user_id FROM inserted_user),
                (SELECT hashed_otp FROM in_data),
                0,
                NOW(),
                NULL
            )
            RETURNING 
                (SELECT user_id FROM inserted_user) user_id,
                ${UserVerifications.user_verification_id} verification_id,
                (SELECT created_at FROM inserted_user) created_at,
                ${UserVerifications.verified_at} verified_at  
        )
        SELECT * FROM inserted_verification
    `;
}
