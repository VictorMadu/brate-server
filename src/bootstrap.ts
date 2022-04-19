import { Bootstrap } from "nist-fastify-adapter/bootstrap";
import Fastify from "fastify";
import { ConfigService } from "./utils/config-factory.service";

const fastify = Fastify({
  // https: {
  //   key: KEY,
  //   cert: CERT,
  // },
  logger: true,
});

fastify.ready(() => {
  console.log("\nPrinting the plugins");
  console.log(fastify.printPlugins());
});
fastify.ready(() => {
  console.log("\nPrinting the routes");
  console.log(
    fastify.printRoutes({
      includeHooks: true,
      includeMeta: ["metaProperty"],
      commonPrefix: false,
    })
  );
});

const bootstrap = new Bootstrap(fastify);

bootstrap.load();

console.log("env", process.env.NODE_ENV);

let config = new ConfigService();

const address = config.get("app.address");
const port = config.get("app.port");
fastify.listen(port, address, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  bootstrap.emitStart();
  console.log("Server listening at", address);
});

fastify.addHook("onClose", () => bootstrap.emitClose());

// Memory deallocation. Maybe unncessary
(config as any) = undefined;
