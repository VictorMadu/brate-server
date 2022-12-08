import { QueryResult } from 'pg';
import { Users, UserVerifications } from '../../../databases/postgres/erate/tables';
import { Runner } from '../../../databases/db';
import { Database } from '../../../error';

export default class Repository {
    private userId!: string;
    private static errorConstraintMap = {
        users_email_key: 'EMAIL_EXISTS',
    } as Record<string, string>;

    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async saveUser(inData: { name: string; email: string; phone: string; hashedPassword: string }) {
        try {
            const result: QueryResult<{ user_id: string }> = await this.runner.run(
                Repository.UserInsertQuery,
                [inData.email, inData.name, inData.phone, inData.hashedPassword],
            );
            return { id: result.rows[0].user_id };
        } catch (error) {
            throw new Database(this.obtainErrorCode(error));
        }
    }

    async saveVerificationForUser(inData: { hashedOTP: string }, userModel: { id: string }) {
        try {
            await this.runner.run(Repository.VerificationInsertQuery, [
                userModel.id,
                inData.hashedOTP,
            ]);
        } catch (error) {
            throw new Database(this.obtainErrorCode(error));
        }
    }

    // TODO: Explicit set out constraints in database design
    obtainErrorCode(error: any) {
        console.log('error', error);
        return Repository.errorConstraintMap[error?.constraint as string] ?? 'UNKNOWN';
    }

    getUserId() {
        return this.userId;
    }

    private static UserInsertQuery = `
        INSERT INTO ${Users.$$NAME}
        (
            ${Users.email},
            ${Users.name},
            ${Users.phone},
            ${Users.password}
        )
        VALUES (%L)
        RETURNING ${Users.user_id} AS user_id
    `;

    private static VerificationInsertQuery = `
        INSERT INTO ${UserVerifications.$$NAME}
        (
            ${UserVerifications.user_id},
            ${UserVerifications.otp}
        )
        VALUES (%L)
    `;
}
