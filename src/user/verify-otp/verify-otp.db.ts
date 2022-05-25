import { Injectable } from "nist-core/injectables";
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
      async (psql) => await new VerificationUserRunner(psql, this.helper).runAndReturnUserId(inData)
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
  constructor(private psql: PoolClient, private helper: PostgresHeplper) {}

  async runAndReturnUserId(inData: InData) {
    const result = await this.psql.query<{ user_id: string | null }>(`
    ${this.basicQuery(t, inData)}
    RETURNING 
      ${this.getUserDetailsIfMatched(t)} AS user_id
  `);

    return this.helper.getFromFirstRow(result, "user_id");
  }

  async runAndReturnIsVerified(inData: InData) {
    const result = await this.psql.query<{ is_matched: boolean }>(`
    ${this.basicQuery(t, inData)}
    RETURNING 
      ${this.isMatchedQuery()} AS is_matched
  `);
    return this.helper.getFromFirstRow(result, "is_matched");
  }

  private basicQuery(userTable: string, inData: InData) {
    const uvd = user_verification_details;
    return ` 
      UPDATE 
        ${uvd.$$NAME}
      SET 
        ${this.setQuery(this.helper.sanitize(inData.otp))}  
      FROM 
        ${users.$$NAME} AS ${userTable}
      WHERE 
        ${userTable}.${users.email} = ${this.helper.sanitize(inData.email)} AND   
        ${uvd.$$NAME}.${uvd.user_verification_details_id} = ${userTable}.${
      users.verification_details
    } [
          array_length(
            ${userTable}.${users.verification_details}, 
            1
          )
        ] AND 
        COALESCE (
         ( ${uvd.$$NAME}.${uvd.one_time_password} <> ${uvd.$$NAME}.${uvd.tried_passwords} [
            array_length(
              ${uvd.$$NAME}.${uvd.tried_passwords}, 
              1
            )
          ]), TRUE
        )
    `;
  }

  private setQuery(sanitizedTriedOTP: string) {
    const uvd = user_verification_details;
    return `
      ${uvd.tried_passwords} = array_append(
        ${uvd.tried_passwords},
        ${sanitizedTriedOTP}
      ),
        ${uvd.tried_passwords_at} = array_append(
          ${uvd.tried_passwords_at},
        NOW()
      )
    `;
  }

  private isMatchedQuery() {
    const uvd = user_verification_details;
    return `
      ${uvd.$$NAME}.${uvd.one_time_password} = 
      ${uvd.$$NAME}.${uvd.tried_passwords}[
        array_length(
          ${uvd.$$NAME}.${uvd.tried_passwords}, 1
          )
      ]
    `;
  }

  private getUserDetailsIfMatched(userTable: string) {
    return `
      CASE ${this.isMatchedQuery()}
      WHEN 't' THEN ${userTable}.${users.user_id}
      ELSE NULL 
      END
    `;
  }
}
