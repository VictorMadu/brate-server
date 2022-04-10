import Fastify from "fastify";
import { AppBootstrapper } from "./bootstrap";
import { ConfigFactory } from "./get-config";
import { AppModule } from "./app.module";
import { Config } from "./interfaces";

const fastify = Fastify({
  // https: {
  //   key: KEY,
  //   cert: CERT,
  // },
  logger: true,
});

const config = new ConfigFactory<Config>().getInstance();
const appBootstrapper = new AppBootstrapper(fastify, new AppModule());
appBootstrapper.start(config.get("app.address"), config.get("app.port"));
