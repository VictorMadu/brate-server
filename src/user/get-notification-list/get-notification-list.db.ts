import { Injectable } from "victormadu-nist-core";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import {
    customers,
    notifications,
    sellers,
    users,
    web_clients,
} from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import { timestampToFloat, toString } from "../../utils/postgres-type-cast";

const table = notifications;
const t = "__t";

interface InData {
    userId: string;
    type?: "P" | "F" | "T";
    pageCount: number;
    pageOffset: number;
    from: number | undefined;
    to: number | undefined;
}

interface OutData {
    totalFromLastCheck: number;
    notifications: {
        msg: string;
        type: "P" | "F" | "T";
        created_at: number;
        id: string;
    }[];
}

@Injectable()
export class GetAlertListDbService {
    private defaultNotificationData: OutData = {
        totalFromLastCheck: 0,
        notifications: [],
    };
    constructor(
        private currencyDb: PostgresDbService,
        private helper: PostgresHeplper,
        private runner: PostgresPoolClientRunner
    ) {}

    private onReady() {
        this.runner.setPsql(this.currencyDb.getPsql());
    }
    async getNotificationData(inData: InData): Promise<OutData> {
        const queryResult = await this.runner.runQuery(async (psql) => {
            if (await this._editUserWebData(psql, inData))
                return await this._getNotificationData(psql, inData);
            return undefined;
        });
        return queryResult ?? this.defaultNotificationData;
    }

    private async _getNotificationData(psql: PoolClient, inData: InData) {
        const notifications = await this.getNotificationMsg(psql, inData);
        if (!notifications) return undefined;
        const totalNotificationFromLastCheck = await this.getTotalFromLastCheck(psql, inData);

        return {
            totalFromLastCheck: totalNotificationFromLastCheck ?? 0,
            notifications,
        };
    }

    private async _editUserWebData(psql: PoolClient, inData: InData): Promise<boolean> {
        const queryCreator = new EditUserDataQueryCreator({
            userId: this.helper.sanitize(inData.userId),
        });

        const result = await psql.query(queryCreator.getQuery());
        return result.rowCount != null && result.rowCount > 0;
    }

    private async getNotificationMsg(
        psql: PoolClient,
        inData: InData
    ): Promise<{ msg: string; id: string; type: "P" | "F" | "T"; created_at: number }[]> {
        // TODO: Instead of convert timestampToFLoat like here in ling 84, for a higher accurate we convert to string and send to client or we multiple the timestamp to a degree of accuracy and send as int
        const result = await psql.query<{
            msg: string;
            id: string;
            type: "P" | "F" | "T";
            created_at: number;
        }>(`
        SELECT 
          ${toString(table.msg)} as msg,
          ${table.notification_id} as id,
          ${timestampToFloat(table.created_at)} as created_at
        FROM 
          ${table.$$NAME}
        WHERE
          ${table.user_id} = ${this.helper.sanitize(inData.userId)} AND
          ${table.deleted_at} IS NULL AND
          ${this.createWhereTypeQuery(inData.type)} AND
          ${this.createWhereFromCondQuery(inData)} AND
          ${this.createWhereToQuery(inData.to)}
        OFFSET
          ${inData.pageOffset}
        FETCH FIRST ${inData.pageCount} ROWS ONLY 
      `);
        return this.helper.getAllRows(result);
    }

    private async getTotalFromLastCheck(psql: PoolClient, inData: InData) {
        const n = "__n";
        const w = "__w";

        const result = await psql.query<{ total: number }>(`
      SELECT 
        COUNT(*) as total
      FROM
        ${notifications.$$NAME} AS ${n}
      LEFT JOIN 
        ${web_clients.$$NAME} AS ${w}
      ON
        ${w}.${web_clients.user_id} = ${n}.${notifications.user_id}
      WHERE 
        ${n}.${notifications.deleted_at} IS NULL AND
        ${w}.${web_clients.user_id} = ${this.helper.sanitize(inData.userId)} AND 
        ${n}.${notifications.created_at} >=  COALESCE(
          (${w}.${web_clients.notification_check_at}[
            array_length(
              ${w}.${web_clients.notification_check_at}, 1
            )
          ]), 
          ${n}.${notifications.created_at}
        )
    `);
        return this.helper.getFromFirstRow(result, "total");
    }

    private createWhereTypeQuery(type?: "P" | "F" | "T") {
        if (type == null) return "TRUE";
        return `${notifications.type} = ${this.helper.sanitize(type)}`;
    }

    private createWhereFromCondQuery(inData: InData) {
        const from = this.helper.sanitize(inData.from);
        if (from == null) return `TRUE`;
        return `EXTRACT(EPOCH FROM ${table.created_at}) >= ${from}`;
    }

    private createWhereToQuery(to?: number) {
        if (to == null) return `TRUE`;
        return `EXTRACT(EPOCH FROM ${table.created_at}) <= ${this.helper.sanitize(to)}`;
    }
}

class EditUserDataQueryCreator {
    private userId: string;

    constructor(sanitizedInData: { userId: string }) {
        this.userId = sanitizedInData.userId;
    }

    getQuery() {
        return `
      UPDATE
        ${web_clients.$$NAME}
      SET
        ${web_clients.notification_check_at} = NOW()
      WHERE
        ${web_clients.user_id} = ${this.userId}
    `;
    }
}
