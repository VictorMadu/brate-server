import { FastifyInstance } from "fastify";
import { AppBootstrap } from "nist-fastify-adapter";
import { IServiceEventHandler } from "nist-fastify-adapter/interfaces/bootstrap.interfaces";
import corsPlugin from "fastify-cors";

export class AppBootstrapper {
  private serviceEventHandler: IServiceEventHandler;
  private acceptedCORSRegExp: RegExp = /.*?/;

  constructor(private fastify: FastifyInstance, private module: any) {
    const fastifyBoostrapperInstance = this.getFastifyBoostrapperInstance();
    this.serviceEventHandler = fastifyBoostrapperInstance.getServiceEventHandler();
  }

  public start(address: string, port: number) {
    this.addOnReadyListener();
    this.registerCorsHandle();
    this.registerServerCloseHandler();
    this.startUpServer(port, address);
  }

  private startUpServer(port: number, address: string) {
    this.fastify.listen(port, address, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      this.serviceEventHandler.emitStart();
      console.log("Server listening at", address);
    });
  }

  private registerCorsHandle() {
    this.fastify.register(corsPlugin, {
      origin: (origin, cb) => this.corsHandler(origin, cb),
    });
  }

  private corsHandler(
    origin: string,
    cb: (err: Error | null, allow: boolean) => void
  ) {
    console.log("\n\nOrigin", origin);

    if (this.isAcceptedOrigin(origin)) return cb(null, true);
    else return cb(null, true);
  }

  private isAcceptedOrigin(origin: string) {
    return this.acceptedCORSRegExp.test(origin);
  }

  private registerServerCloseHandler() {
    this.fastify.addHook("onClose", () => this.serviceEventHandler.emitClose());
  }

  private addOnReadyListener() {
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

  private getFastifyBoostrapperInstance() {
    return new AppBootstrap(this.fastify, this.module);
  }
}
