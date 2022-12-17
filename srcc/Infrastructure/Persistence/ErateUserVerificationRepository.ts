import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Users, UserVerifications } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import { AtLeastOne, ExactlyOne } from 'ts-util-types';
import User from '../../Domain/Aggregates/User';
import UserVerifcation from '../../Domain/Entities/UserVerification';
import EntityDate from '../../Domain/ValueObjects/AppDates/EntityDate';
import NormalEntityDate from '../../Domain/ValueObjects/AppDates/NormalDate';
import { InsertFailed } from '../../Application/Common/Errors';
import UserVerificationRepository from '../../Application/Common/Interfaces/Repository/UserVerificationRepository';
import NullEntityDate from '../../Domain/ValueObjects/AppDates/null-date';

interface RawUserVerifcationModel {
    user_id: TableDataType.UserVerification['user_id'];
    otp: TableDataType.UserVerification['otp'];
    no_of_tries: TableDataType.UserVerification['no_of_tries'];
    created_at: TableDataType.UserVerification['created_at'];
    verified_at: TableDataType.UserVerification['verified_at'];
    user_verification_id: TableDataType.UserVerification['user_verification_id'];
}

export interface UserVerifcationModel {
    userId: string;
    email: string;
    hashedOTP: string;
    noOfTries: number;
    createdAt: EntityDate;
    verifiedAt: EntityDate;
}

export default class ErateUserVerificationRepository implements UserVerificationRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async insertOne(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
        verification: Pick<UserVerifcation, 'hashedOTP' | 'noOfTries' | 'createdAt' | 'verifiedAt'>;
    }): Promise<Pick<UserVerifcation, 'createdAt' | 'verifiedAt' | 'verificationId'>> {
        const { user, verification } = inData;
        try {
            const result: QueryResult<
                Pick<RawUserVerifcationModel, 'created_at' | 'verified_at' | 'user_verification_id'>
            > = await this.runner.run(
                ErateUserVerificationRepository.InsertQuery,
                verification.hashedOTP,
                verification.noOfTries,
                verification.createdAt.getForRepository(),
                verification.createdAt.getForRepository(),
                verification.verifiedAt.getForRepository(),
                verification.verifiedAt.getForRepository(),
                user.userId,
                user.email,
            );

            const row = result.rows[0];

            if (row != null) {
                return UserVerifcation.createFromStore({
                    verificationId: row.user_verification_id,
                    createdAt: new NormalEntityDate(row.created_at),
                    verifiedAt:
                        row.verified_at == null
                            ? new NullEntityDate()
                            : new NormalEntityDate(row.verified_at),
                });
            }
            throw new InsertFailed();
        } catch (error) {
            throw new InsertFailed();
        }
    }

    async findOne(inData: {
        filters: AtLeastOne<{ userId: string; email: string }>;
    }): Promise<
        Pick<
            UserVerifcation,
            'verificationId' | 'hashedOTP' | 'noOfTries' | 'createdAt' | 'verifiedAt'
        >
    > {
        const result: QueryResult<
            Pick<
                RawUserVerifcationModel,
                'user_verification_id' | 'otp' | 'no_of_tries' | 'created_at' | 'verified_at'
            >
        > = await this.runner.run(
            ErateUserVerificationRepository.GetQuery,
            inData.filters.userId,
            inData.filters.email,
        );

        const row = result.rows[0];
        if (row != null) {
            return UserVerifcation.createFromStore({
                verificationId: row.user_verification_id,
                createdAt: new NormalEntityDate(row.created_at),
                verifiedAt:
                    row.verified_at == null
                        ? new NullEntityDate()
                        : new NormalEntityDate(row.verified_at),
            });
        }
        return UserVerifcation.createFromStore({ isNull: true });
    }

    async saveNewOTP(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
        verification: Pick<UserVerifcation, 'hashedOTP'>;
    }): Promise<
        Pick<UserVerifcation, 'verificationId' | 'noOfTries' | 'createdAt' | 'verifiedAt'>
    > {
        const result: QueryResult<
            Pick<
                RawUserVerifcationModel,
                'user_verification_id' | 'otp' | 'no_of_tries' | 'created_at' | 'verified_at'
            >
        > = await this.runner.run(
            ErateUserVerificationRepository.UpdateOTP,
            inData.verification.hashedOTP,
            inData.user.userId,
            inData.user.email,
        );

        const row = result.rows[0];
        if (row != null) {
            return UserVerifcation.createFromStore({
                verificationId: row.user_verification_id,
                noOfTries: row.no_of_tries,
                createdAt: new NormalEntityDate(row.created_at),
                verifiedAt:
                    row.verified_at == null
                        ? new NullEntityDate()
                        : new NormalEntityDate(row.verified_at),
            });
        }
        return UserVerifcation.createFromStore({ isNull: true });
    }

    async updateRetries(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
    }): Promise<
        Pick<UserVerifcation, 'verificationId' | 'noOfTries' | 'createdAt' | 'verifiedAt'>
    > {
        const result: QueryResult<
            Pick<
                RawUserVerifcationModel,
                'user_verification_id' | 'otp' | 'no_of_tries' | 'created_at' | 'verified_at'
            >
        > = await this.runner.run(
            ErateUserVerificationRepository.UpdateRetries,
            inData.user.userId,
            inData.user.email,
        );

        const row = result.rows[0];
        if (row != null) {
            return UserVerifcation.createFromStore({
                verificationId: row.user_verification_id,
                noOfTries: row.no_of_tries,
                createdAt: new NormalEntityDate(row.created_at),
                verifiedAt:
                    row.verified_at == null
                        ? new NullEntityDate()
                        : new NormalEntityDate(row.verified_at),
            });
        }
        return UserVerifcation.createFromStore({ isNull: true });
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
    `;

    private static GetQuery = `
        SELECT 
            _verification.${UserVerifications.user_verification_id} user_verification_id, 
            _verification.${UserVerifications.otp} hashed_otp,
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

    private static UpdateOTP = `
        UPDATE ${UserVerifications.$$NAME}
        SET 
            ${UserVerifications.otp} = %L,
            ${UserVerifications.created_at} = NOW(),
            ${UserVerifications.verified_at} = NULL
        WHERE
            _verification.${UserVerifications.user_id} = (
                SELECT _user.${Users.user_id}
                FROM ${Users.$$NAME}
                WHERE
                    _user.${Users.user_id} = %L OR 
                    _user.${Users.email} = %L
            )
        RETURNING 
            ${UserVerifications.user_verification_id} user_verification_id,
            ${UserVerifications.no_of_tries} no_of_tries,
            ${UserVerifications.created_at} created_at,
            ${UserVerifications.verified_at} verified_at,
    `;

    private static UpdateRetries = `
        UPDATE ${UserVerifications.$$NAME}
        SET 
            ${UserVerifications.no_of_tries} = ${UserVerifications.no_of_tries} + 1
        WHERE
            _verification.${UserVerifications.user_id} = (
                SELECT _user.${Users.user_id}
                FROM ${Users.$$NAME}
                WHERE
                    _user.${Users.user_id} = %L OR 
                    _user.${Users.email} = %L
            )
        RETURNING 
            ${UserVerifications.user_verification_id} user_verification_id,
            ${UserVerifications.no_of_tries} no_of_tries,
            ${UserVerifications.created_at} created_at,
            ${UserVerifications.verified_at} verified_at,
    `;
}
