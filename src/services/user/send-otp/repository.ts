import { QueryResult } from 'pg';
import { Users, UserVerifications } from '../../../databases/postgres/erate/tables';
import { Runner } from '../../../databases/db';
import * as AppError from '../../../error';

interface InData {
    email: string;
    hashedOTP: string;
}

export default class Repository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async saveVerificationForUser(inData: InData) {
        try {
            const result: QueryResult<{ user_id: string }> = await this.runner.run(
                Repository.query,
                inData.hashedOTP,
                inData.email,
            );
            return { userId: result.rows[0].user_id };
        } catch (error) {
            throw new AppError.Database(this.obtainErrorCode(error));
        }
    }

    private obtainErrorCode(error: any) {
        return 'UNKNOWN';
    }

    private static query = `
        INSERT INTO ${UserVerifications.$$NAME}
            (
                ${UserVerifications.user_id},
                ${UserVerifications.otp}
            ) 
            SELECT user_id, (%L)
            FROM ${Users.$$NAME}
            WHERE ${Users.email} = (%L)
        ON CONFLICT (${UserVerifications.user_id})
        DO UPDATE SET 
            ${UserVerifications.otp} = EXCLUDED.${UserVerifications.otp},
            ${UserVerifications.no_of_tries} = 0,
            ${UserVerifications.created_at} = NOW()
        RETURNING ${UserVerifications.user_id}
    `;
}
