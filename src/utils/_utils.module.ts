import { Module } from "nist-core";
import { AuthParserService } from "./auth-manager.service";
import { ConfigService } from "./config-factory.service";
import { PostgresFactoryService } from "./postgres-db-manager.service";

@Module({
  services: [ConfigService, AuthParserService, PostgresFactoryService],
  exports: [ConfigService, AuthParserService],
})
export class UtilsModule {}
