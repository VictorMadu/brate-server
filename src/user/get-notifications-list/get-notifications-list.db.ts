import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient, QueryResult } from "pg";
import { notifications } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";

interface InData {
  userId: string;
  pageCount: number;
  pageOffset: number;
  timeFrom?: number;
  timeTo?: number;
  type?: "P" | "T" | "F";
}

interface OutData {
  id: string;
  type: "P" | "T" | "F";
  msg: string;
  created_at: number;
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

  async getUserNotificationData(inData: InData): Promise<OutData[] | undefined> {
    return await this.runner.runQuery(
      async (psql) => await this._getUserNotificationData(psql, inData)
    );
  }

  async _getUserNotificationData(psql: PoolClient, inData: InData): Promise<OutData[] | undefined> {
    const queryCreator = new GetUserDataQueryCreator({
      userId: this.helper.sanitize(inData.userId),
      pageCount: this.helper.sanitize(inData.pageCount),
      pageOffset: this.helper.sanitize(inData.pageOffset),
      timeFrom: this.helper.sanitize(inData.timeFrom),
      timeTo: this.helper.sanitize(inData.timeTo),
      type: this.helper.sanitize(inData.type),
    });

    const result = await psql.query<OutData>(queryCreator.getQuery());
    return this.helper.getAllRows(result);
  }
}
// TODO: use abstract factory pattern
class GetUserDataQueryCreator {
  private userId: string;
  private pageCount: number;
  private pageOffset: number;
  private timeFrom?: number;
  private timeTo?: number;
  private type: "P" | "T" | "F" | undefined;

  constructor(sanitizedInData: InData) {
    this.userId = sanitizedInData.userId;
    this.pageCount = sanitizedInData.pageCount;
    this.pageOffset = sanitizedInData.pageOffset;
    this.timeFrom = sanitizedInData.timeFrom;
    this.timeTo = sanitizedInData.timeTo;
    this.type = sanitizedInData.type;
  }

  getQuery() {
    return `
      SELECT
        ${notifications.notification_id} AS id,
        ${notifications.msg} AS msg,
        ${notifications.type} AS type,
        ${notifications.created_at} AS created_at
      FROM
        ${notifications.$$NAME}
      WHERE
        ${notifications.user_id} = ${this.userId} AND
        ${notifications.deleted_at} IS NOT NULL AND
        ${this.forTypeWhere()} AND
        ${this.timeFromWhere()} AND
        ${this.timeToWhere()}
      ORDER BY
        ${notifications.created_at} DESC
      LIMIT
        ${this.pageOffset}
      FETCH FIRST ${this.pageCount} ROWS ONLY
    `;
  }

  private forTypeWhere() {
    if (this.type == null) return "TRUE";
    return `${notifications.type} = ${this.type}`;
  }

  private timeFromWhere() {
    if (this.timeFrom == null) return "TRUE";
    return `${notifications.created_at} >= ${this.timeFrom}`;
  }

  private timeToWhere() {
    if (this.timeTo == null) return "TRUE";
    return `${notifications.created_at} <= ${this.timeTo}`;
  }
}
