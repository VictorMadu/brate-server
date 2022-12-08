import { QueryResult } from 'pg';
import { Users, UserVerifications } from '../../../databases/postgres/erate/tables';
import * as TableDataType from '../../../databases/postgres/erate/table-data-types';
import { Runner } from '../../../databases/db';

export interface VerificationModel {
    user_id: TableDataType.UserVerification['user_id'];
    hashed_otp: TableDataType.UserVerification['otp'];
    no_of_tries: TableDataType.UserVerification['no_of_tries'];
    created_at: TableDataType.UserVerification['created_at'];
    verified_at: TableDataType.UserVerification['verified_at'];
}

export interface OutData {
    userId: VerificationModel['user_id'];
    hashedOTP: VerificationModel['hashed_otp'];
    noOfTries: VerificationModel['no_of_tries'];
}

export type DataForUpdate = {
    verificationModel: Pick<VerificationModel, 'user_id' | 'no_of_tries'>;
};

export default class Repository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async getUserVerificationModel(inData: { email: string }): Promise<OutData> {
        const result: QueryResult<VerificationModel> = await this.runner.run(
            Repository.GetQuery,
            inData.email,
        );

        return {
            userId: result.rows[0].user_id,
            hashedOTP: result.rows[0].hashed_otp,
            noOfTries: result.rows[0].no_of_tries,
        };
    }

    async flagVerified(data: Pick<OutData, 'userId' | 'noOfTries'>) {
        return this.runner.run(Repository.UpdateQuery, data.noOfTries + 1, new Date(), data.userId);
    }

    async flagUnVerified(data: Pick<OutData, 'userId' | 'noOfTries'>) {
        return this.runner.run(Repository.UpdateQuery, data.noOfTries + 1, null, data.userId);
    }

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
            _user.${Users.email} = %L
    `;

    private static UpdateQuery = `
        UPDATE ${UserVerifications.$$NAME}
        SET 
            ${UserVerifications.no_of_tries} = %L,
            ${UserVerifications.verified_at} = %L
        WHERE ${UserVerifications.user_id} =  %L  
    `;
}
