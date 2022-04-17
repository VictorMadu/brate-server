import { FastifyInstance, FastifyLoggerInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";
import { Inject, Injectable } from "nist-core";
import { ICloseListener, IReadyListener } from "nist-fastify-adapter";
import postgres from "postgres";
import { ConfigService } from "utils/config-factory.service";
import { PostgresKeys } from "utils/interfaces/postgres-instance-base.interface";
import { PostgresFactoryService } from "utils/postgres-db-manager.service";
import { PostgresInstanceBase } from "utils/postgres-instance-base";

@Injectable()
export class CurrencyPostgresDbService extends PostgresInstanceBase {
  constructor(
    @Inject(ConfigService) config: ConfigService,
    @Inject(PostgresFactoryService) postgresFactory: PostgresFactoryService
  ) {
    super(config, postgresFactory);
  }

  getLastestParallelCurrencyRates() {
    this.getPsql()`
      SELECT currency_id, LAST_VALUE(rate) 
      FROM parallel_rates
      GROUP BY currency_id
      ORDER BY time ASC
      OFFSET ${1}
      FETCH FIRST ${1} ROWS ONLY
    `;
  }

  protected getUserNameKey(): PostgresKeys<"username"> {
    return "postgres.clients.currency.username";
  }
  protected getPasswordKey(): PostgresKeys<"password"> {
    return "postgres.clients.currency.password";
  }
}
