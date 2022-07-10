import { IncomingMessage, ServerResponse, Server } from "http";
import Fastify, { FastifyInstance, FastifyLoggerInstance, onCloseHookHandler } from "fastify";
import corsPlugin, {
    FastifyCorsOptions,
    FastifyCorsOptionsDelegate,
    FastifyPluginOptionsDelegate,
} from "fastify-cors";
import { OrWithPromise } from "ts-util-types";

type OnListenFn = (err: Error | null, address: string) => OrWithPromise<void>;

export class FastifyManager {
    private fastify = Fastify({
        // https: {
        //   key: KEY,
        //   cert: CERT,
        // },
        logger: true,
    });
    private onListenFns: OnListenFn[] = [];

    constructor() {
        this.addOnReadyActions();
    }

    addCors(
        options: FastifyCorsOptions | FastifyPluginOptionsDelegate<FastifyCorsOptionsDelegate>
    ) {
        this.fastify.register(corsPlugin, options);
        return this;
    }

    addOnCloseAction(
        hook: onCloseHookHandler<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>
    ) {
        this.fastify.addHook("onClose", hook);
        return this;
    }

    addOnListenFn(onListenFn: OnListenFn) {
        this.onListenFns.push(onListenFn);
        return this;
    }

    listen(port: string | number, address: string) {
        this.fastify.listen(port, address, async (err, address) => {
            for (let i = 0; i < this.onListenFns.length; i++)
                await this.onListenFns[i](err, address);
        });
    }

    private addOnReadyActions() {
        this.fastify.ready(() => {
            this.printPlugins();
            this.printRoutes();
        });
    }

    private printPlugins() {
        console.log("\nPrinting the plugins");
        console.log(this.fastify.printPlugins());
    }

    private printRoutes() {
        console.log("\nPrinting the routes");
        console.log(
            this.fastify.printRoutes({
                includeHooks: true,
                includeMeta: ["metaProperty"],
                commonPrefix: false,
            })
        );
    }

    getFastify() {
        return this.fastify;
    }
}
