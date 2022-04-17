import { Module } from "nist-core";
import { CurrencyModule } from "./currency/currency.module";

@Module({
  imports: [CurrencyModule],
})
export class AppModule {}
