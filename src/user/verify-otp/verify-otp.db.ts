import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users, user_verification_details } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper } from "../../utils/postgres-helper";
import { InnerKeys, InnerValue } from "ts-util-types";
import { get } from "lodash";

interface InData {
  email: string;
  otp: string;
}

const t = "__t";

@Injectable()
export class DbService {
  psql!: PoolClient;
  constructor(private db: PostgresDbService, private helper: PostgresHeplper) {}

  private onReady() {
    this.psql = this.db.getPsql();
  }

  async verifyUserAndReturnUserData(inData: InData) {
    const result = await this.psql.query<{ userId: string | null }>(`
      ${this.basicQuery(t, inData)}
      RETURNING 
        ${this.getUserDetailsIfMatched(t)} AS userId
    `);

    return this.helper.getPropFromFirstRow(result, "userId");
  }

  async verifyUserAndReturnIfVerifed(inData: InData) {
    const result = await this.psql.query<{ isMatched: boolean }>(`
      ${this.basicQuery(t, inData)}
      RETURNING 
        ${this.isMatchedQuery()} AS isMatched
    `);

    return this.helper.getPropFromFirstRow(result, "isMatched");
  }

  private basicQuery(userTable: string, inData: InData) {
    return ` 
      UPDATE 
        ${user_verification_details.$$NAME}
      SET 
        ${this.setQuery(this.helper.sanitize(inData.otp))}
      FROM 
        ${users.$$NAME} AS ${userTable}
      WHERE 
        ${userTable}.${users.email} = ${this.helper.sanitize(inData.email)} AND   
        ${userTable}.${users.verification_details} [
          array_length(
            ${userTable}.${users.verification_details}
          )
        ] = ${user_verification_details.user_verification_details_id}
    `;
  }

  private setQuery(sanitizedTriedOTP: string) {
    return `
      ${user_verification_details.tried_passwords} = array_append(
        ${user_verification_details.tried_passwords},
        ${sanitizedTriedOTP}
      ),
      ${user_verification_details.tried_passwords_at} = array_append(
        ${user_verification_details.tried_passwords_at},
        NOW()
      )
    `;
  }

  private isMatchedQuery() {
    return `
      ${user_verification_details.one_time_password} = 
      ${user_verification_details.tried_passwords_at}[
        array_length(
          ${user_verification_details.tried_passwords_at}
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
