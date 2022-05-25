import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient, QueryResult } from "pg";
import {
  users,
  user_verification_details,
} from "../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../utils/postgres-helper";

interface InData {
  email: string;
  one_time_pwd: string;
}

interface VerificationOutData {
  id: string;
  one_time_pwd: string;
}

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

  async saveAndReturnOTPAndEmail(inData: InData) {
    return await this.runner.runQuery(
      async (psql) =>
        await UserVerificationCreator.runCreationOfUserVerificationProcess(
          psql,
          inData,
          this.helper
        )
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
      oneTimePwd: verificationDetails.one_time_pwd,
      email: userDetails.email,
    };
  }

  async createVerificationAndReturnDetails() {
    const uvd = user_verification_details;
    console.log(
      "createVerificationAndReturnDetails query",
      `
    INSERT INTO
    ${user_verification_details.$$NAME}
    (
      ${user_verification_details.one_time_password}
    )
  SELECT 
    ${this.helper.sanitize(this.inData.one_time_pwd)}
  WHERE
    -- If user is already verified
    NOT EXISTS (
      SELECT 
        1 
      FROM 
        ${users.$$NAME} as u
      INNER JOIN 
        ${uvd.$$NAME} as uvd
      ON 
        uvd.${uvd.user_verification_details_id} = u.${
        users.verification_details
      } [
          array_length(
            u.${users.verification_details}, 
            1
          )
        ]
      WHERE
       ${users.email} = ${this.helper.sanitize(this.inData.email)} AND
       uvd.${uvd.one_time_password} = uvd.${uvd.tried_passwords} [
        array_length(
          uvd.${uvd.tried_passwords}, 
          1
        )
      ]
    )
  RETURNING 
    ${user_verification_details.user_verification_details_id} as id,
    ${user_verification_details.one_time_password} as one_time_pwd `
    );

    try {
      const result = await this.psql.query<VerificationOutData>(`
    INSERT INTO
      ${user_verification_details.$$NAME}
      (
        ${user_verification_details.one_time_password}
      )
    SELECT 
      ${this.helper.sanitize(this.inData.one_time_pwd)}
    WHERE
      -- If user is already verified
      NOT EXISTS (
        SELECT 
          1 
        FROM 
          ${users.$$NAME} as u
        INNER JOIN 
          ${uvd.$$NAME} as uvd
        ON 
          uvd.${uvd.user_verification_details_id} = u.${
        users.verification_details
      } [
            array_length(
              u.${users.verification_details}, 
              1
            )
          ]
        WHERE
         ${users.email} = ${this.helper.sanitize(this.inData.email)} AND
         uvd.${uvd.one_time_password} = uvd.${uvd.tried_passwords} [
          array_length(
            uvd.${uvd.tried_passwords}, 
            1
          )
        ]
      )
    RETURNING 
      ${user_verification_details.user_verification_details_id} as id,
      ${user_verification_details.one_time_password} as one_time_pwd  
  `);
      console.log("createVerificationAndReturnDetails result", result);
      return this.helper.getFirstRow(result);
    } catch (error) {
      console.log("createVerificationAndReturnDetails error", error);
      throw error;
    }
  }

  async updateUserWithVerificationDetailsAndGetDetails(
    verificationDetails: VerificationOutData
  ) {
    const result = await this.psql.query<{ email: string }>(`
    UPDATE
      ${users.$$NAME}
    SET 
      ${users.verification_details} = array_append(
        ${users.verification_details},
        ${this.helper.sanitize(verificationDetails.id)}
      )
    WHERE
      ${users.email} = ${this.helper.sanitize(this.inData.email)}
    RETURNING 
      ${users.email} as email
`);
    return this.helper.getFirstRow(result);
  }
}
