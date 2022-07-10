import Bootstrap from "victormadu-nist-fastify-adapter";
import { ConfigService } from "../utils/config-service";
import { FastifyManager } from "_app/fastify-manager";

import "./currency/controller-handlers";
import "./user";
import "./market";
import "./wallet";
import "./_ws";
import "./_crons";

export class AppStarter {
    bootstrap: Bootstrap;
    address: string;
    port: number;

    private constructor(private fastifyManager: FastifyManager, config: ConfigService) {
        this.bootstrap = new Bootstrap(this.fastifyManager.getFastify());
        this.address = config.get("app.address");
        this.port = config.get("app.port");
    }

    static startApp(fastifyManager: FastifyManager, config: ConfigService) {
        const appStarter = new AppStarter(fastifyManager, config);
        appStarter.addCors().addOnCloseListener().startBootstrapping().startListening();
    }

    private addCors() {
        const hostUrlsToAllow = /.*/;
        this.fastifyManager.addCors({
            origin: (origin, cb) => {
                if (hostUrlsToAllow.test(origin)) return cb(null, true);
                return cb(new Error("Not allowed"), false);
            },
        });

        return this;
    }

    private startBootstrapping() {
        this.bootstrap.load();
        return this;
    }

    private addOnCloseListener() {
        this.fastifyManager.addOnCloseAction(() => this.handleClose());
        return this;
    }

    private handleClose() {
        () => this.bootstrap.emitClose();
    }

    private startListening() {
        this.fastifyManager
            .addOnListenFn(async (err, address) => {
                if (err) return this.shutDownServer();
                return this.handleStart(address);
            })
            .listen(this.port, this.address);
        return this;
    }

    private shutDownServer() {
        process.exit(1);
    }

    private async handleStart(address: string) {
        await this.bootstrap.emitStart();
        console.log("Server listening at", address);
    }
}
