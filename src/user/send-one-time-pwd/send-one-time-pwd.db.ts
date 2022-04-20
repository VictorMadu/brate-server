import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users, user_verification_details } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper } from "../../utils/postgres-helper";
import { InnerKeys, InnerValue } from "ts-util-types";
import { get } from "lodash";

interface InData {
  email: string;
  one_time_pwd: string;
}

interface VerificationOutData {
  id: string;
  oneTimePwd: string;
}

@Injectable()
export class DbService {
  psql!: PoolClient;
  constructor(private db: PostgresDbService, private helper: PostgresHeplper) {}

  private onReady() {
    this.psql = this.db.getPsql();
  }

  async saveAndReturnOTPAndEmail(inData: InData) {
    let results:
      | {
          email: string;
          oneTimePwd: string;
        }
      | undefined;
    try {
      this.helper.beginTransaction(this.psql);
      results = await this.runCreationOfVerificationProcess(inData);
      this.helper.endPoolClientTransaction(this.psql, results);
      return results;
    } catch (error) {
      this.helper.endPoolClientTransaction(this.psql, results);
    }
    return results;
  }

  private async runCreationOfVerificationProcess(inData: InData) {
    return UserVerificationCreator.runCreationOfUserVerificationProcess(
      this.psql,
      inData,
      this.helper
    );
  }
}

export class UserVerificationCreator {
  constructor(
    private psql: PoolClient,
    private inData: { one_time_pwd: string; email: string },
    private helper: PostgresHeplper
  ) {}

  static async runCreationOfUserVerificationProcess(
    psql: PoolClient,
    inData: InData,
    helper: PostgresHeplper
  ) {
    const creator = new UserVerificationCreator(psql, inData, helper);
    const verificationDetails = await creator.createVerificationAndReturnDetails();
    if (!verificationDetails) return undefined;
    const userDetails = await creator.updateUserWithVerificationDetailsAndGetDetails(
      verificationDetails
    );

    if (!userDetails) return undefined;
    return {
      oneTimePwd: verificationDetails.oneTimePwd,
      email: userDetails.email,
    };
  }

  async createVerificationAndReturnDetails() {
    const result = await this.psql.query<VerificationOutData>(`
      INSERT INTO
        ${user_verification_details.$$NAME}
        (
          ${user_verification_details.one_time_password},
        )
      VALUES 
        (
          ARRAY [${this.helper.sanitize(this.inData.one_time_pwd)}]
        )
      RETURNING 
        ${user_verification_details.user_verification_details_id} as id,
        ${user_verification_details.one_time_password} as oneTimePwd
         
    `);

    return this.helper.getFromFirstRow(result);
  }

  async updateUserWithVerificationDetailsAndGetDetails(verificationDetails: VerificationOutData) {
    const result = await this.psql.query<{ email: string }>(`
    UPDATE
      ${users.$$NAME}
    WHERE
      ${users.email} = ${this.helper.sanitize(this.inData.email)}
    SET 
      ${users.verification_details} = array_append(
        ${users.verification_details},
        ${this.helper.sanitize(verificationDetails)}
       )
    RETURNING 
      ${users.email} as email,
  `);

    return this.helper.getFromFirstRow(result);
  }
}
