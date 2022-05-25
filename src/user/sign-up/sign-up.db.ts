import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient, QueryResult } from "pg";
import {
  customers,
  sellers,
  users,
  web_clients,
} from "../../utils/postgres-db-types/erate";
import {
  PostgresHeplper,
  PostgresPoolClientRunner,
} from "../../utils/postgres-helper";
import { UserVerificationCreator } from "../send-one-time-pwd/send-one-time-pwd.db";

interface InData {
  name: string;
  password: string;
  email: string;
  phone: string;
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

  async query(inData: InData) {
    console.log("query inData", inData);
    try {
      const result = await this.runner.runQuery(
        async (psql) =>
          await this.runUserCreationProcessAndGetData(psql, inData)
      );
      console.log("query", result);
      return result;
    } catch (error) {
      console.log("query", error);
      throw error;
    }
  }
  // TODO:Use trigger and this code is dirty
  private async runUserCreationProcessAndGetData(
    psql: PoolClient,
    inData: InData
  ) {
    const verificationData = await this.createVerificationAndGetData(
      psql,
      inData
    );
    if (!verificationData) return undefined;
    const userData = await this.createUserAndGetData(
      psql,
      inData,
      verificationData
    );
    if (!userData) return undefined;
    const sellerData = await this.createSeller(psql, userData.user_id);
    if (!sellerData) return undefined;
    const isWebClientCreated = await this.createWebClient(
      psql,
      userData.user_id
    );
    if (!isWebClientCreated) return undefined;
    return userData;
  }

  private async createVerificationAndGetData(psql: PoolClient, inData: InData) {
    const creator = new UserVerificationCreator(psql, inData, this.helper);
    return await creator.createVerificationAndReturnDetails();
  }

  private async createUserAndGetData(
    psql: PoolClient,
    inData: InData,
    verificationData: { id: string }
  ) {
    console.log(
      "createUserAndGetData query",
      ` INSERT INTO 
    ${users.$$NAME}
    (
      ${users.email},
      ${users.name},
      ${users.password},
      ${users.phone},
      ${users.verification_details}
    )
  VALUES
    (
      ${this.helper.sanitize(inData.email).slice(0, 64)},
      ${this.helper.sanitize(inData.name).slice(0, 64)},
      ${this.helper.sanitize(inData.password).slice(0, 64)},
      ${this.helper.sanitize(inData.phone).slice(0, 64)},
      ARRAY[(${this.helper.sanitize(verificationData.id)})::uuid]
    )
  ON CONFLICT (${users.email}) DO NOTHING
  RETURNING 
    ${users.email} as email,
    ${users.user_id} as user_id`
    );
    try {
      const result = await psql.query<{ email: string; user_id: string }>(`
    INSERT INTO 
      ${users.$$NAME}
      (
        ${users.email},
        ${users.name},
        ${users.password},
        ${users.phone},
        ${users.verification_details}
      )
    VALUES
      (
        ${this.helper.sanitize(inData.email).slice(0, 64)},
        ${this.helper.sanitize(inData.name).slice(0, 64)},
        ${this.helper.sanitize(inData.password).slice(0, 64)},
        ${this.helper.sanitize(inData.phone).slice(0, 64)},
        ARRAY[(${this.helper.sanitize(verificationData.id)})::uuid]
      )
    ON CONFLICT (${users.email}) DO NOTHING
    RETURNING 
      ${users.email} as email,
      ${users.user_id} as user_id
    `);
      console.log("createUserAndGetData result", result);
      return this.helper.getFirstRow(result);
    } catch (error) {
      console.log("createUserAndGetData error", error);
      throw error;
    }
  }

  private async createSeller(psql: PoolClient, userId: string) {
    console.log(
      "createSeller query",
      ` INSERT INTO
    ${sellers.$$NAME}
    (
      ${sellers.user_id}
    )
  VALUES
      (
        ${this.helper.sanitize(userId)}
      )`
    );
    try {
      const result = await psql.query(`
    INSERT INTO
      ${sellers.$$NAME}
      (
        ${sellers.user_id}
      )
    VALUES
        (
          ${this.helper.sanitize(userId)}
        )
  `);
      console.log("createSeller result", result);
      return result.rowCount;
    } catch (error) {
      console.log("createSeller error", error);
      throw error;
    }
  }

  private async createWebClient(psql: PoolClient, userId: string) {
    console.log("createWebClient query", ``);

    try {
      const result = await psql.query(`
      INSERT INTO
        ${web_clients.$$NAME}
        (
          ${web_clients.user_id},
          ${web_clients.language}
        )
      VALUES
        (
          ${this.helper.sanitize(userId)},
          ${this.helper.sanitize("English")}
        )
    `);

      console.log("createWebClient result", result);

      return result.rowCount;
    } catch (error) {
      console.log("createWebClient error", error);
      throw error;
    }
  }
}
