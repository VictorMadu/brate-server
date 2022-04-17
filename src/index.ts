import Fastify from "fastify";
import { AppBootstrapper } from "./bootstrap";
import { ConfigService } from "./utils/config-factory.service";
import { AppModule } from "./app.module";

const fastify = Fastify({
  // https: {
  //   key: KEY,
  //   cert: CERT,
  // },
  logger: true,
});

console.log("env", process.env.NODE_ENV);

const config = new ConfigService();
const appBootstrapper = new AppBootstrapper(fastify, new AppModule());

const address = config.get("app.address");
const port = config.get("app.port");
appBootstrapper.start(address, port);

// Memory deallocation. Maybe unncessary
(config as any) = undefined;
