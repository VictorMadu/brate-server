import { Injectable } from "nist-core/injectables";
import { PostgresDbService } from "../_utils/user.db.service";
import { PoolClient } from "pg";
import { users } from "../../utils/postgres-db-types/erate";
import { PostgresHeplper, PostgresPoolClientRunner } from "../../utils/postgres-helper";
import Redis from "ioredis";

interface InData {
  userId: string;
  ip: string;
}

export const redis = new Redis();
const EXPIRE_AT = 60 * 5; // 5 mins

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

  async createWsTicketForUser(inData: InData): Promise<boolean> {
    const ok = await redis.setex("ws:ticket:" + inData.ip, EXPIRE_AT, inData.userId);
    return !!ok;
  }
}
