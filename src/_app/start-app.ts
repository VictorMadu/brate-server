import Bootstrap from "victormadu-nist-fastify-adapter";
import { ConfigService } from "../utils/config-service";
import { FastifyManager } from "./fastify-manager";

import "../user";
import "../wallet";
import "../market";
import "../currency";
import "../_ws";
import "../_crons";

export class AppStarter {
    bootstrap: Bootstrap;

    private constructor(private fastifyManager: FastifyManager) {
        this.bootstrap = new Bootstrap(this.fastifyManager.getFastify());
    }

    static startApp(fastifyManager: FastifyManager) {
        const appStarter = new AppStarter(fastifyManager);
        return appStarter._startApp();
    }

    private _startApp() {
        this.addOnCloseListeners();
        this.startBootstrapping();
        this.startListening();
    }

    private addOnCloseListeners() {
        this.fastifyManager.addOnCloseListenerFn(() => this.bootstrap.emitClose());
    }

    private startBootstrapping() {
        this.bootstrap.load();
    }

    private startListening() {
        this.fastifyManager.listen().catch(() => this.shutDownServer());
    }

    private shutDownServer() {
        process.exit(1);
    }
}
