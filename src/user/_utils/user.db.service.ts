import { Injectable } from "victormadu-nist-core";
import { PostgresInstanceManager } from "../../utils/postgres-db-manager.service";

@Injectable()
export class PostgresDbService {
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
