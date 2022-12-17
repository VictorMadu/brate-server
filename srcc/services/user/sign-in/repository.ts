import { QueryResult } from 'pg';
import { Users, UserVerifications } from '../../../databases/postgres/erate/tables';
import { Runner } from '../../../databases/db';
import { Database } from '../../../error';

export interface UserModel {
    id: string;
    email: string;
    hashedPwd: string;
}

export interface UserVerificationModel {
    verifiedAt: Date | null;
}

interface RawUserVerificationModel {
    verified_at: Date;
}

interface RawUserModel {
    user_id: string;
    email: string;
    hashed_pwd: string;
}

export class NullUserModel implements UserModel {
    id = '';
    email = '';
    hashedPwd = '';
}

export class NullUserVerificationModel implements UserVerificationModel {
    verifiedAt = null;
}

export default class Repository {
    constructor(private runner: Runner<string, QueryResult<any>>) {}

    async getUser(inData: { email: string }): Promise<UserModel> {
        try {
            const result: QueryResult<RawUserModel> = await this.runner.run(Repository.UserQuery, [
                inData.email,
            ]);

            return this.getUserModel(result.rows);
        } catch (error) {
            throw new Database(this.obtainErrorCode(error));
        }
    }

    async getUserVerification(userModel: Pick<UserModel, 'id'>): Promise<UserVerificationModel> {
        try {
            const result: QueryResult<RawUserVerificationModel> = await this.runner.run(
                Repository.VerificationQuery,
                [userModel.id],
            );
            return this.getUserVerificationModel(result.rows);
        } catch (error) {
            throw new Database(this.obtainErrorCode(error));
        }
    }

    private getUserModel(rows: RawUserModel[]) {
        if (rows[0] == null) return new NullUserModel();

        const { user_id, email, hashed_pwd } = rows[0];
        return { id: user_id, email, hashedPwd: hashed_pwd };
    }

    private getUserVerificationModel(rows: RawUserVerificationModel[]) {
        if (rows[0] == null) return new NullUserVerificationModel();
        return { verifiedAt: rows[0].verified_at };
    }

    private obtainErrorCode(error: any) {
        return 'UNKNOWN';
    }

    private static UserQuery = `
        SELECT 
            ${Users.user_id} user_id,
            ${Users.email} email,
            ${Users.password} hashed_pwd
        FROM
            ${Users.$$NAME}
        WHERE 
            ${Users.email} = %L
    `;

    private static VerificationQuery = `
        SELECT 
            ${UserVerifications.verified_at}
        FROM    
            ${UserVerifications.$$NAME}
        WHERE 
            ${UserVerifications.user_id} = %L
    `;
}
