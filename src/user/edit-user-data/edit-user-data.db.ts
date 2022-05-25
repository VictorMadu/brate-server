import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
  userId: string;
  phone?: string;
  email?: string;
  name?: string;
}

@Injectable()
export class DbService {
  constructor(
    private currencyDb: PostgresDbService,
    private helper: PostgresHeplper,
    private runner: PostgresPoolClientRunner
  ) {}

  private onReady() {
    this.runner.setPsql(this.currencyDb.getPsql());
  }

  async editUserData(inData: InData): Promise<boolean> {
    return (
      (await this.runner.runQuery(async (psql) => {
        const isSuccessful = await this._editUserData(psql, inData);
        if (!isSuccessful) return undefined;
        return true;
      })) || false
    );
  }

  async _editUserData(psql: PoolClient, inData: InData): Promise<boolean> {
    if (inData.email == null && inData.name == null && inData.phone == null) return false;

    const queryCreator = new EditUserDataQueryCreator({
      userId: this.helper.sanitize(inData.userId),
      email: this.helper.sanitize(inData.email),
      name: this.helper.sanitize(inData.name),
      phone: this.helper.sanitize(inData.phone),
    });

    const result = await psql.query(queryCreator.getQuery());
    return this.helper.hasAlteredTable(result);
  }
}

class EditUserDataQueryCreator {
  private userId: string;
  private email: string | undefined;
  private name: string | undefined;
  private phone: string | undefined;

  constructor(sanitizedInData: InData) {
    this.userId = sanitizedInData.userId;
    this.email = sanitizedInData.email;
    this.name = sanitizedInData.name;
    this.phone = sanitizedInData.phone;
  }

  getQuery() {
    if (this.email == null && this.name == null && this.phone == null) return ``;
    return `
      UPDATE
        ${users.$$NAME}
      SET
        ${this.createColSetQuery(users.email, this.email)},
        ${this.createColSetQuery(users.name, this.name)},
        ${this.createColSetQuery(users.phone, this.phone)}
      WHERE
        ${users.user_id} = ${this.userId}
    `;
  }

  private createColSetQuery(colName: string, newData: string | undefined) {
    if (newData == null) return `${colName} = ${colName}`;
    return `${colName} = ${newData}`;
  }
}
