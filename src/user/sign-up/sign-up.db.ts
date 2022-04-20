import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users, user_verification_details } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper } from "../../utils/postgres-helper";
import { UserVerificationCreator } from "user/send-one-time-pwd/send-one-time-pwd.db";

interface InData {
  name: string;
  password: string;
  email: string;
  phone: string;
  one_time_pwd: string;
}

@Injectable()
export class DbService {
  psql!: PoolClient;
  constructor(private db: PostgresDbService, private helper: PostgresHeplper) {}

  private onReady() {
    this.psql = this.db.getPsql();
  }

  async query(inData: InData) {
    try {
      this.helper.beginTransaction(this.psql);
      const result = await this.runUserCreationProcessAndGetData(inData);
      this.helper.endPoolClientTransaction(this.psql, result);
      return result;
    } catch (error) {
      this.helper.endPoolClientTransaction(this.psql, undefined);
    }
    return undefined;
  }

  private async runUserCreationProcessAndGetData(inData: InData) {
    const verificationData = await this.createVerificationAndGetData(inData);
    if (!verificationData) return undefined;
    const userData = await this.createUserAndGetData(inData, verificationData);
    return userData;
  }

  private async createVerificationAndGetData(inData: InData) {
    const creator = new UserVerificationCreator(this.psql, inData, this.helper);
    return await creator.createVerificationAndReturnDetails();
  }

  private async createUserAndGetData(inData: InData, verificationData: { id: string }) {
    const result = await this.psql.query<{ email: string }>(`
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
          ${this.helper.sanitize(inData.email)},
          ${this.helper.sanitize(inData.name)},
          ${this.helper.sanitize(inData.password)},
          ${this.helper.sanitize(inData.phone)},
          ARRAY[${this.helper.sanitize(verificationData.id)}]
        )
      RETURNING 
        ${users.email} as email
    `);

    return this.helper.getFromFirstRow(result);
  }
}
