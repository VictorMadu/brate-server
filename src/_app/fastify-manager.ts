import Fastify, { FastifyInstance } from "fastify";
import pfs from "fs/promises";
import corsPlugin from "fastify-cors";
import { OrWithPromise } from "ts-util-types";
import { map } from "lodash";
import { ConfigService, funcs } from "../utils";

type OnStartListnerFn = (err: Error | null) => OrWithPromise<void>;
type OnReadyListnerFn = () => OrWithPromise<void>;
type OnCloseListnerFn = () => OrWithPromise<void>;

export class FastifyManager {
    private fastify!: FastifyInstance;
    private onReadyListenersFns: OnReadyListnerFn[] = [];
    private onStartListnerFns: OnStartListnerFn[] = [];
    private onCloseListnerFns: OnCloseListnerFn[] = [];

    private constructor(private config: ConfigService) {}

    static async getInstance(config: ConfigService) {
        const fastifyManager = new FastifyManager(config);
        await fastifyManager.initializeFastify();
        return fastifyManager;
    }

    addOnReadyListenerFn(onReadyListenerFn: OnReadyListnerFn) {
        this.onReadyListenersFns.push(onReadyListenerFn);
        return this;
    }

    addOnStartListnerFn(onStartListnerFn: OnStartListnerFn) {
        this.onStartListnerFns.push(onStartListnerFn);
        return this;
    }

    addOnCloseListenerFn(onCloseListenerFn: OnCloseListnerFn) {
        this.onCloseListnerFns.push(onCloseListenerFn);
        return this;
    }

    async listen() {
        this.addCors();
        this.addPrintDetailsOnReadyActions();
        this.callOnReadyListeners();
        this.addOnCloseActionsToFastify();
        await this.startListening();
    }

    close() {
        return this.fastify.close();
    }

    getFastify() {
        return this.fastify;
    }

    private async initializeFastify() {
        const options = await this.getHttps()
            .then((https) => ({
                https,
                logger: true,
            }))
            .catch(() => ({ logger: true }));

        this.fastify = Fastify(options);
    }

    private getHttps() {
        const httpsConfig = this.config.get("app.https");
        if (httpsConfig == null) return Promise.reject();

        const { keyFilePath, certFilePath } = httpsConfig;
        return new Promise<{ key: string; cert: string }>((resolve, reject) => {
            const readKeyFile = this.readFile(keyFilePath);
            const readCertFile = this.readFile(certFilePath);
            Promise.all([readKeyFile, readCertFile])
                .then(([key, cert]) =>
                    resolve({
                        key,
                        cert,
                    })
                )
                .catch(reject);
        });
    }

    private readFile(path: string) {
        return pfs.readFile(path, { encoding: "utf-8" });
    }

    private addCors() {
        const hostUrlsToAllowMatcher = this.getHostUrlsToAllowMatcher();
        this.fastify.register(corsPlugin, {
            origin: (origin, cb) => {
                if (hostUrlsToAllowMatcher.test(origin)) return cb(null, true);
                return cb(new Error("Not allowed"), false);
            },
        });
        return this;
    }

    private getHostUrlsToAllowMatcher() {
        const corsArr = this.config.get("app.cors");
        const corsRegExps = map(corsArr, (cors) => funcs.convertStrToRegExpStr(cors));
        const orOneOfCorsRegExps = funcs.getOrOneOfRegExpStr(...corsRegExps);

        return new RegExp(orOneOfCorsRegExps);
    }

    private addPrintDetailsOnReadyActions() {
        this.fastify.ready(() => {
            this.printPlugins();
            this.printRoutes();
        });
    }

    private callOnReadyListeners() {
        this.runListeners(this.onReadyListenersFns);
    }

    private async runListeners<T extends any[]>(
        listners: ((...args: T) => OrWithPromise<void>)[],
        ...args: T
    ) {
        for (let i = 0; i < listners.length; i++) await listners[i](...args);
    }

    private addOnCloseActionsToFastify() {
        this.fastify.addHook("onClose", () => this.runListeners(this.onCloseListnerFns));
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

    private startListening() {
        const port = this.config.get("app.port");
        const address = this.config.get("app.host");

        return new Promise<void>((resolve, reject) => {
            this.fastify.listen(port, address, async (err, address) => {
                if (err) return reject(err);

                await this.runListeners(this.onStartListnerFns, err);
                return resolve();
            });
        });
    }
}
