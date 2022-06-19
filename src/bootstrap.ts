import Fastify from "fastify";
import { ConfigService } from "./utils/config-factory.service";
import { AppStarter } from "./start-app";

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

console.log("env", process.env.NODE_ENV);
const starter = new AppStarter(fastify, new ConfigService());

starter.start();
