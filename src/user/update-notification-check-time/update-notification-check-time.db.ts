import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { web_clients } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
    userId: string;
    lastCheckTime: number;
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

    async updateLastCheck(inData: InData): Promise<boolean> {
        return !!(await this.runner.runQuery((psql) => this._editUserWebData(psql, inData)));
    }

    async _editUserWebData(psql: PoolClient, inData: InData): Promise<boolean> {
        const queryCreator = new EditUserDataQueryCreator({
            userId: this.helper.sanitize(inData.userId),
            lastCheckTime: this.helper.sanitize(inData.lastCheckTime),
        });
        console.log("queryCreator", queryCreator.getQuery());
        const result = await psql.query(queryCreator.getQuery());
        return result.rowCount != null && result.rowCount > 0;
    }
}

class EditUserDataQueryCreator {
    private userId: string;
    private lastCheckTime: number;

    constructor(sanitizedInData: InData) {
        this.userId = sanitizedInData.userId;
        this.lastCheckTime = sanitizedInData.lastCheckTime;
    }

    // TODO: Should we do it like this or we check if the lastCheckTime we want to add is higher than the last item of the array
    getQuery() {
        return `
      UPDATE
        ${web_clients.$$NAME}
      SET
        ${web_clients.notification_check_at} = ARRAY_APPEND(${web_clients.notification_check_at}, to_timestamp(${this.lastCheckTime})::TIMESTAMPTZ)
      WHERE
        ${web_clients.user_id} = ${this.userId}
    `;
    }
}
