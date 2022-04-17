import { Module } from "nist-core";
import { UtilsModule } from "utils/_utils.module";
import { CurrencyPostgresDbService } from "./currency.db.service";
import { CurrencyHttpController } from "./currency.http.controller";
import { CurrencyService } from "./currency.service";

@Module({
  imports: [UtilsModule],
  services: [CurrencyService, CurrencyPostgresDbService],
  controllers: [CurrencyHttpController],
})
export class CurrencyModule {}
