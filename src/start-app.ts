import { FastifyInstance } from "fastify";
import { Bootstrap } from "nist-fastify-adapter/bootstrap";
import { ConfigService } from "./utils/config-factory.service";
import corsPlugin from "fastify-cors";

export class AppStarter {
    bootstrap: Bootstrap;
    address: string;
    port: number;

    constructor(private fastify: FastifyInstance, config: ConfigService) {
        this.bootstrap = new Bootstrap(this.fastify);
        this.address = config.get("app.address");
        this.port = config.get("app.port");
    }

    start() {
        this.addCors();
        this.addOnCloseListener();
        this.startBootstrapping();
        this.startListening();
    }

    private addCors() {
        this.fastify.register(corsPlugin, {
            origin: (origin, cb) => {
                if (/.*?/.test(origin)) return cb(null, true);
                return cb(null, true);
                // return cb(new Error("Not allowed"), false);
            },
        });
    }

    private startBootstrapping() {
        this.bootstrap.load();
    }

    private addOnCloseListener() {
        this.fastify.addHook(
            "onClose",
            async () => await this.bootstrap.emitClose()
        );
    }

    private startListening() {
        this.fastify.listen(this.port, this.address, async (err, address) => {
            this.shutDownServerIfErr(err);
            await this.bootstrap.emitStart();
            console.log("Server listening at", address);
        });
    }

    private shutDownServerIfErr(err: Error | null) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    }
}
