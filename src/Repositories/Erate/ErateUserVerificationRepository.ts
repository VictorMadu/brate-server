import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Users, UserVerifications } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import { AtLeastOne, ExactlyOne } from 'ts-util-types';
import ModelDate from '../../entities/data-types/date/date';
import NullModelDate from '../../entities/data-types/date/null-date';
import NormalModelDate from '../../entities/data-types/date/normal-date';
import UserVerificationRepository from '../../Application/Common/Interfaces/Repositories/UserVerificationRepository';
import { FailedSave } from '../../Application/Common/Errors/Database';
import { User } from '../../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../../Application/Common/Interfaces/Entities/UserVerification';

interface RawUserVerifcationModel {
    user_id: TableDataType.UserVerification['user_id'];
    verification_id: TableDataType.UserVerification['user_verification_id'];
    otp: TableDataType.UserVerification['otp'];
    no_of_tries: TableDataType.UserVerification['no_of_tries'];
    created_at: TableDataType.UserVerification['created_at'];
    verified_at: TableDataType.UserVerification['verified_at'];
}

export default class ErateUserVerificationRepository implements UserVerificationRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}
    async findOne(inData: {
        filters: AtLeastOne<{ userId: string; email: string }>;
    }): Promise<
        Pick<
            UserVerification,
            'hashedOTP' | 'verificationId' | 'createdAt' | 'verifiedAt' | 'noOfTries'
        >
    > {
        try {
            const result: QueryResult<
                Pick<
                    RawUserVerifcationModel,
                    'created_at' | 'verified_at' | 'verification_id' | 'otp' | 'no_of_tries'
                >
            > = await this.runner.run(
                ErateUserVerificationRepository.GetQuery,
                inData.filters.userId,
                inData.filters.email,
            );

            const row = result.rows[0];
            return {
                verificationId: row.verification_id,
                hashedOTP: row.otp,
                noOfTries: row.no_of_tries,
                createdAt: row.created_at,
                verifiedAt: row.verified_at,
            };
        } catch (error) {
            throw new FailedSave();
        }
    }

    async insertOne(inData: {
        user: Pick<User, 'userId' | 'email'>;
        verification: Pick<UserVerification, 'hashedOTP'>;
    }): Promise<Pick<UserVerification, 'createdAt' | 'verifiedAt' | 'verificationId'>> {
        const { user, verification } = inData;
        try {
            const result: QueryResult<
                Pick<RawUserVerifcationModel, 'created_at' | 'verified_at' | 'verification_id'>
            > = await this.runner.run(
                ErateUserVerificationRepository.InsertQuery,
                user.userId,
                verification.hashedOTP,
            );

            const row = result.rows[0];
            return {
                verificationId: row.verification_id,
                createdAt: row.created_at,
                verifiedAt: row.verified_at,
            };
        } catch (error) {
            throw new FailedSave();
        }
    }

    async saveNewOTP(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
        verification: Pick<UserVerification, 'hashedOTP'>;
    }): Promise<Pick<UserVerification, 'verificationId' | 'createdAt' | 'verifiedAt'>> {
        const result: QueryResult<
            Pick<RawUserVerifcationModel, 'verification_id' | 'created_at' | 'verified_at'>
        > = await this.runner.run(
            ErateUserVerificationRepository.SaveNewOTPQuery,
            inData.verification.hashedOTP,
            inData.user.userId,
            inData.user.email,
        );

        const row = result.rows[0];
        return {
            verificationId: row.verification_id,
            createdAt: row.created_at,
            verifiedAt: row.verified_at,
        };
    }

    async updateRetries(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
    }): Promise<
        Pick<UserVerification, 'verificationId' | 'noOfTries' | 'createdAt' | 'verifiedAt'>
    > {
        const result: QueryResult<
            Pick<
                RawUserVerifcationModel,
                'verification_id' | 'created_at' | 'verified_at' | 'no_of_tries'
            >
        > = await this.runner.run(
            ErateUserVerificationRepository.UpdateRetriesQuery,
            inData.user.userId,
            inData.user.email,
        );

        const row = result.rows[0];
        return {
            verificationId: row.verification_id,
            createdAt: row.created_at,
            verifiedAt: row.verified_at,
            noOfTries: row.no_of_tries,
        };
    }

    async setVerified(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
    }): Promise<Pick<UserVerification, 'verifiedAt' | 'verificationId'>> {
        const result: QueryResult<
            Pick<
                RawUserVerifcationModel,
                'verification_id' | 'created_at' | 'verified_at' | 'no_of_tries'
            >
        > = await this.runner.run(
            ErateUserVerificationRepository.SetVerifiedQuery,
            inData.user.userId,
            inData.user.email,
        );

        const row = result.rows[0];
        return {
            verificationId: row.verification_id,
            verifiedAt: row.verified_at,
        };
    }

    private static InsertQuery = `
        INSERT INTO ${UserVerifications.$$NAME}
            (
                ${UserVerifications.user_id},
                ${UserVerifications.otp},
                ${UserVerifications.no_of_tries},
                ${UserVerifications.created_at},
                ${UserVerifications.verified_at}
            ) 
        VALUES (
            %L,
            %L,
            0,
            NOW(),
            NULL
        )
        RETURNING 
            ${UserVerifications.user_verification_id} verification_id,
            ${UserVerifications.created_at} created_at,
            ${UserVerifications.verified_at} verified_at  
    `;

    private static SaveNewOTPQuery = `
        UPDATE ${UserVerifications.$$NAME}
        SET
            ${UserVerifications.otp} = %L,
            ${UserVerifications.no_of_tries} = 0,
            ${UserVerifications.created_at} = NOW(),
            ${UserVerifications.verified_at} = NULL          
        WHERE 
            ${UserVerifications.user_id} = (
                SELECT ${Users.user_id}
                FROM ${Users.$$NAME}
                WHERE
                    ${Users.user_id} = %L OR
                    ${Users.email} = %L
            )
        RETURNING 
            ${UserVerifications.user_verification_id} verification_id,
            ${UserVerifications.created_at} created_at,
            ${UserVerifications.verified_at} verified_at  
    `;

    private static UpdateRetriesQuery = `
        UPDATE ${UserVerifications.$$NAME}
        SET
            ${UserVerifications.no_of_tries} =  ${UserVerifications.no_of_tries} + 1   
        WHERE 
            ${UserVerifications.user_id} = (
                SELECT ${Users.user_id}
                FROM ${Users.$$NAME}
                WHERE
                    ${Users.user_id} = %L OR
                    ${Users.email} = %L
            )
        RETURNING 
            ${UserVerifications.user_verification_id} verification_id,
            ${UserVerifications.otp} otp,
            ${UserVerifications.created_at} created_at,
            ${UserVerifications.verified_at} verified_at  
    `;

    private static SetVerifiedQuery = `
        UPDATE ${UserVerifications.$$NAME}
        SET
            ${UserVerifications.verified_at} =  NOW()      
        WHERE 
            ${UserVerifications.user_id} = (
                SELECT ${Users.user_id}
                FROM ${Users.$$NAME}
                WHERE
                    ${Users.user_id} = %L OR
                    ${Users.email} = %L
            )
        RETURNING 
            ${UserVerifications.user_verification_id} verification_id,
            ${UserVerifications.verified_at} verified_at  
    `;

    private static _InsertQuery = `
        INSERT INTO ${UserVerifications.$$NAME}
            (
                ${UserVerifications.user_id},
                ${UserVerifications.otp},
                ${UserVerifications.no_of_tries},
                ${UserVerifications.created_at},
                ${UserVerifications.verified_at}
            ) 
            SELECT 
                _user.user_id, 
                %L,
                %L,
                (
                    CASE 
                    WHEN %L = 'current_time' THEN NOW() 
                    ELSE %L
                ),
                (
                    CASE 
                    WHEN %L = 'current_time' THEN NOW() 
                    ELSE %L
                )
            FROM 
                ${Users.$$NAME} _user
            LEFT JOIN 
                ${UserVerifications.$$NAME} _verification
            ON 
                _user.${Users.user_id} = _verification.${UserVerifications.user_id}
            WHERE 
                _user.${Users.email} = %L OR 
                _user.${Users.user_id} = %L
        ON CONFLICT (${UserVerifications.user_id})
        DO UPDATE SET 
            ${UserVerifications.otp} = EXCLUDED.${UserVerifications.otp},
            ${UserVerifications.no_of_tries} = EXCLUDED.${UserVerifications.no_of_tries},
            ${UserVerifications.created_at} = EXCLUDED.${UserVerifications.created_at},
            ${UserVerifications.verified_at} = EXCLUDED.${UserVerifications.verified_at}
        RETURNING 
            ${UserVerifications.user_verification_id} verification_id,
            ${UserVerifications.created_at} created_at,
            ${UserVerifications.verified_at} verified_at
    `;

    private static GetQuery = `
        SELECT 
            _verification.${UserVerifications.user_verification_id} verification_id,
            _verification.${UserVerifications.user_id} user_id, 
            _verification.${UserVerifications.otp} otp,
            _verification.${UserVerifications.no_of_tries} no_of_tries,
            _verification.${UserVerifications.created_at} created_at,
            _verification.${UserVerifications.verified_at} verified_at
        FROM
            ${UserVerifications.$$NAME} _verification
        LEFT JOIN 
            ${Users.$$NAME} _user
        ON 
            _verification.${UserVerifications.user_id} =  _user.${Users.user_id}
        WHERE
            _user.${Users.user_id} = %L OR 
            _user.${Users.email} = %L 
    `;
}
