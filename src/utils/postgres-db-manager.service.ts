import { Injectable, Inject } from "victormadu-nist-core";
import postgres from "postgres";
import { ConfigService } from "./config-service";
import { PostgresKeys } from "./interfaces/postgres-instance-base.interface";
import { Pool, PoolClient } from "pg";

class PostgresInstanceService {
    private pool: Pool;
    private poolClient!: PoolClient;

    constructor(
        private config: ConfigService,
        private userNameKey: PostgresKeys<"username">,
        private passwordKey: PostgresKeys<"password">
    ) {
        this.pool = new Pool({
            host: this.config.get("postgres.host"),
            port: this.config.get("postgres.port"),
            database: this.config.get("postgres.database"),
            max: this.config.get("postgres.clients.currency.pool_size"),
            user: this.config.get(this.userNameKey),
            password: this.config.get(this.passwordKey),
        });
    }

    async startDb() {
        this.poolClient = await this.pool.connect();
    }

    async closeDb() {
        await this.pool.end();
    }

    getPsql() {
        return this.poolClient;
    }
}

// TODO: Why is injectable instance constructor always being called many times. Maybe from injectable. Look at it

@Injectable()
export class PostgresInstanceManager {
    managedItems = new Map<Object, PostgresInstanceService>();

    constructor(private config: ConfigService) {
        console.log("Ran constructor");
    }

    setUserAndPwdKeyForCtx(
        ctx: Object,
        userKey: PostgresKeys<"username">,
        pwdKey: PostgresKeys<"password">
    ) {
        this.managedItems.set(ctx, new PostgresInstanceService(this.config, userKey, pwdKey));
    }

    getPsql(ctx: Object) {
        const managedItem = this.managedItems.get(ctx);
        if (!managedItem)
            throw new Error("userName and password  keys were not set for " + ctx.constructor.name);
        return managedItem.getPsql();
    }

    async onReady() {
        console.log("Running this ready listenser");
        const postgresInstanceServices = this.managedItems.values();
        let postgresInstanceService: PostgresInstanceService;
        while ((postgresInstanceService = postgresInstanceServices.next().value))
            await postgresInstanceService.startDb();
    }

    onClose() {
        this.managedItems.forEach((postgresInstanceService) => postgresInstanceService.closeDb());
    }

    private getConfigValueWithKey(key: PostgresKeys<"username" | "password">) {
        return this.config.get(key);
    }
}
