import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
    userId: string;
    phone?: string;
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
        if (inData.name == null && inData.phone == null) return false;

        const queryCreator = new EditUserDataQueryCreator({
            userId: this.helper.sanitize(inData.userId),
            name: this.helper.sanitize(inData.name),
            phone: this.helper.sanitize(inData.phone),
        });

        const result = await psql.query(queryCreator.getQuery());
        return this.helper.hasAlteredTable(result);
    }
}

class EditUserDataQueryCreator {
    private userId: string;
    private name: string | undefined;
    private phone: string | undefined;

    constructor(sanitizedInData: InData) {
        this.userId = sanitizedInData.userId;
        this.name = sanitizedInData.name;
        this.phone = sanitizedInData.phone;
    }

    getQuery() {
        if (this.name == null && this.phone == null) return ``;
        return `
      UPDATE
        ${users.$$NAME}
      SET
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
