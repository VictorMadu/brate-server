import { IReadyListener, ICloseListener } from "nist-fastify-adapter";
import postgres from "postgres";
import { InnerKeys } from "ts-util-types";
import { ConfigService } from "./config-factory.service";
import { Config } from "./interfaces/config-manager.interface";
import { PostgresKeys } from "./interfaces/postgres-instance-base.interface";
import { PostgresFactoryService } from "./postgres-db-manager.service";

export abstract class PostgresInstanceBase {
  psql!: postgres.Sql<{}>;

  constructor(
    private config: ConfigService,
    private postgresFactory: PostgresFactoryService
  ) {}

  protected abstract getUserNameKey(): PostgresKeys<"username">;
  protected abstract getPasswordKey(): PostgresKeys<"password">;

  protected getPsql() {
    return this.psql;
  }

  protected onReady() {
    const userName = this.getConfigValueWithKey(this.getUserNameKey());
    const password = this.getConfigValueWithKey(this.getPasswordKey());
    this.psql = this.postgresFactory.getInstanceUsingUserAndPwd(
      userName,
      password
    );
  }

  protected onClose() {
    this.psql.end();
  }

  private getConfigValueWithKey(key: PostgresKeys<"username" | "password">) {
    return this.config.get(key);
  }
}
