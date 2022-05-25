import { Injectable } from "nist-core/injectables";
import { PostgresInstanceManager } from "../../utils/postgres-db-manager.service";

@Injectable()
export class PostgresDbManager {
  constructor(private postgresManager: PostgresInstanceManager) {
    this.postgresManager.setUserAndPwdKeyForCtx(
      this,
      "postgres.clients.currency.username",
      "postgres.clients.currency.password"
    );
  }

  getPsql() {
    return this.postgresManager.getPsql(this);
  }
}
