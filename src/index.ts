import "reflect-metadata";

import { FastifyManager, AppStarter } from "./_app";
import { ConfigService } from "./utils";

main();

async function main() {
    const fastifyManager = await FastifyManager.getInstance(new ConfigService());
    AppStarter.startApp(fastifyManager);
}
