import "reflect-metadata";

import { FastifyManager } from "_app/fastify-manager";
import { AppStarter } from "./_app/start-app";
import { ConfigService } from "utils/config-service";

main();

function main() {
    AppStarter.startApp(new FastifyManager(), new ConfigService());
}
