import { Injectable, Inject } from "nist-core";
import postgres from "postgres";
import { ConfigService } from "./config-factory.service";

@Injectable()
export class PostgresFactoryService {
  private host: string;
  private port: number;
  private database: string;
  constructor(@Inject(ConfigService) config: ConfigService) {
    this.host = config.get("postgres.host");
    this.port = config.get("postgres.port");
    this.database = config.get("postgres.database");
  }

  getInstanceUsingUserAndPwd(username: string, password: string) {
    return postgres({
      host: this.host,
      port: this.port,
      database: this.database,
      username,
      password,
    });
  }
}

class PostgresManager {
  sqlInstance: any;
  constructor(
    private host: string,
    private port: number,
    private database: string
  ) {}

  createInstance(username: string, password: string) {
    return (this.sqlInstance = postgres({
      host: this.host,
      port: this.port,
      database: this.database,
      username,
      password,
    }));
  }
}
