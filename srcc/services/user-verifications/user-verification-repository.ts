import { QueryResult } from 'pg';
import { Runner } from '../../databases/db';
import { Users, UserVerifications } from '../../databases/postgres/erate/tables';
import * as TableDataType from '../../databases/postgres/erate/table-data-types';
import _ from 'lodash';
import { AtLeastOne, ExactlyOne } from 'ts-util-types';
import EntityDate from '../../entities/data-types/date/date';
import NullEntityDate from '../../entities/data-types/date/null-date';
import NormalEntityDate from '../../entities/data-types/date/normal-date';

interface RawUserVerifcationModel {
    user_id: TableDataType.UserVerification['user_id'];
    otp: TableDataType.UserVerification['otp'];
    no_of_tries: TableDataType.UserVerification['no_of_tries'];
    created_at: TableDataType.UserVerification['created_at'];
    verified_at: TableDataType.UserVerification['verified_at'];
}

export interface UserVerifcationModel {
    userId: string;
    email: string;
    hashedOTP: string;
    noOfTries: number;
    createdAt: EntityDate;
    verifiedAt: EntityDate;
}

enum ErrorCode {
    INSERT_FAILED,
    NOT_FOUND,
}

export class NullUserVerificationModel implements UserVerifcationModel {
    userId = '';
    email = '';
    hashedOTP = '';
    noOfTries = 0;
    createdAt = new NullEntityDate();
    verifiedAt = new NullEntityDate();

    constructor(private errorCode: ErrorCode) {}

    getErrorCode() {
        return this.errorCode;
    }
}

export default class UserVerificationRepository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async insertOne(inData: {
        model: UserVerifcationModel & ExactlyOne<Pick<UserVerifcationModel, 'userId' | 'email'>>;
    }): Promise<Pick<UserVerifcationModel, 'createdAt' | 'verifiedAt'>> {
        try {
            const result: QueryResult<Pick<RawUserVerifcationModel, 'created_at' | 'verified_at'>> =
                await this.runner.run(
                    UserVerificationRepository.InsertQuery,
                    inData.model.hashedOTP,
                    inData.model.noOfTries,
                    inData.model.createdAt.getForQuery(),
                    inData.model.createdAt.getForQuery(),
                    inData.model.verifiedAt.getForQuery(),
                    inData.model.verifiedAt.getForQuery(),
                    inData.model.userId,
                    inData.model.email,
                );

            const row = result.rows[0];
            return row == null
                ? new NullUserVerificationModel(ErrorCode.INSERT_FAILED)
                : {
                      createdAt: new NormalEntityDate(row.created_at),
                      verifiedAt: new NormalEntityDate(row.verified_at),
                  };
        } catch (error) {
            return new NullUserVerificationModel(ErrorCode.INSERT_FAILED);
        }
    }

    async findOne(inData: {
        filters: AtLeastOne<{ userId: string; email: string }>;
    }): Promise<
        Pick<
            UserVerifcationModel,
            'userId' | 'hashedOTP' | 'noOfTries' | 'createdAt' | 'verifiedAt'
        >
    > {
        const result: QueryResult<
            Pick<
                RawUserVerifcationModel,
                'user_id' | 'otp' | 'no_of_tries' | 'created_at' | 'verified_at'
            >
        > = await this.runner.run(
            UserVerificationRepository.GetQuery,
            inData.filters.userId,
            inData.filters.email,
        );

        const row = result.rows[0];
        return row == null
            ? new NullUserVerificationModel(ErrorCode.NOT_FOUND)
            : {
                  userId: row.user_id,
                  hashedOTP: row.otp,
                  noOfTries: row.no_of_tries,
                  createdAt: new NormalEntityDate(row.created_at),
                  verifiedAt: new NormalEntityDate(row.verified_at),
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
            ${UserVerifications.created_at} created_at,
            ${UserVerifications.verified_at} verified_at
    `;

    private static GetQuery = `
        SELECT 
            _verification.${UserVerifications.user_id} user_id, 
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
}
