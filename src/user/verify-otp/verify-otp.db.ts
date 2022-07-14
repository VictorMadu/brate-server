import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users, user_verification_details } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import { InnerKeys, InnerValue } from "ts-util-types";
import { get } from "lodash";

interface InData {
    email: string;
    otp: string;
}

const t = "__t";

@Injectable()
export class DbService {
    constructor(
        private db: PostgresDbService,
        private helper: PostgresHeplper,
        private runner: PostgresPoolClientRunner
    ) {}

    private onReady() {
        this.runner.setPsql(this.db.getPsql());
    }

    async verifyUserAndReturnUserData(inData: InData) {
        return await this.runner.runQuery(
            async (psql) =>
                await new VerificationUserRunner(psql, this.helper).runAndReturnUserId(inData)
        );
    }

    async verifyUserAndReturnIfVerifed(inData: InData) {
        return await this.runner.runQuery(
            async (psql) =>
                await new VerificationUserRunner(psql, this.helper).runAndReturnIsVerified(inData)
        );
    }
}

class VerificationUserRunner {
    private userTable = users.$$NAME;
    private uvd = user_verification_details;
    private uvdTable = this.uvd.$$NAME;
    private uvdId = this.uvd.user_verification_details_id;

    constructor(private psql: PoolClient, private helper: PostgresHeplper) {}

    async runAndReturnUserId(inData: InData) {
        const result = await this.psql.query<{ user_id: string | null }>(`
          ${this.basicQuery(inData)}
          RETURNING ${this.getUserDetailsIfMatched()} AS user_id
        `);
        return this.helper.getFromFirstRow(result, "user_id");
    }

    async runAndReturnIsVerified(inData: InData) {
        const result = await this.psql.query<{ is_matched: boolean }>(`
          ${this.basicQuery(inData)}
          RETURNING ${this.isMatchedQuery()} AS is_matched
        `);
        return this.helper.getFromFirstRow(result, "is_matched");
    }

    private basicQuery(inData: InData) {
        const sanitizedOTP = this.helper.sanitize(inData.otp);
        return ` 
        UPDATE 
          ${this.uvd.$$NAME}
        SET 
          ${this.appendSantiziedTriedPwdToRepository(sanitizedOTP)}, 
          ${this.appendTimeOfTrialToRepository()}  
        FROM 
          ${this.userTable}
        WHERE 
          ${this.userTable}.${users.email} = ${this.helper.sanitize(inData.email)} AND   
          ${this.uvdTable}.${this.uvdId} = ${this.userTable}.${users.verification_details} 
            [${this.arrLength(users, "verification_details")}] AND 
          COALESCE (
            ( ${this.uvdTable}.${this.uvd.one_time_password} <> 
              ${this.uvdTable}.${this.uvd.tried_passwords}[${this.arrLength(
            this.uvd,
            "tried_passwords"
        )}]
            ), 
          TRUE)
    `;
    }

    private appendSantiziedTriedPwdToRepository(sanitizedTriedOTP: string) {
        const tp = this.uvd.tried_passwords;
        return `${tp} = array_append(${tp},${sanitizedTriedOTP})
    `;
    }

    private appendTimeOfTrialToRepository() {
        const tpa = this.uvd.tried_passwords_at;
        return `${tpa} = array_append(${tpa},NOW())`;
    }

    private arrLength<T extends Record<string | "$$NAME", string>>(
        table: T,
        columnName: Exclude<keyof T, "$$NAME">
    ) {
        return `array_length(${table["$$NAME"]}.${table[columnName]},1)`;
    }

    private isMatchedQuery() {
        return `
      ${this.uvdTable}.${this.uvd.one_time_password} = 
      ${this.uvdTable}.${this.uvd.tried_passwords}[${this.arrLength(this.uvd, "tried_passwords")}]
    `;
    }

    private getUserDetailsIfMatched() {
        return `CASE ${this.isMatchedQuery()} 
        WHEN 't' THEN ${this.userTable}.${users.user_id}
        ELSE NULL 
        END`;
    }
}
