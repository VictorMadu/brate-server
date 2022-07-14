import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
    email: string;
}

interface OutData {
    user_id: string;
    password: string;
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

    async getUserDataFromEmail(inData: InData) {
        return await this.runner.runQuery(
            async (psql) => await this._getUserDataFromEmail(psql, inData)
        );
    }

    async _getUserDataFromEmail(psql: PoolClient, inData: InData) {
        const result = await psql.query<OutData>(`
      SELECT 
        ${users.user_id} AS user_id,
        ${users.password} AS password
      FROM 
        ${users.$$NAME}
      WHERE 
        ${users.email} = ${this.helper.sanitize(inData.email)}
    `);

        return this.helper.getFirstRow(result);
    }
}
