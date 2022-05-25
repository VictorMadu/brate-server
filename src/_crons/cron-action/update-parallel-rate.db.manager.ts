import { Injectable } from "nist-core/injectables";
import { PostgresInstanceManager } from "../../utils/postgres-db-manager.service";

// TODO: pool max to 1
@Injectable()
export class UpdateParallelRatePostgresDbManager {
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
