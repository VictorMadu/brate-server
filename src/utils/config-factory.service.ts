import { Injectable } from "nist-core/injectables";
import { InnerKeys, InnerValue } from "ts-util-types";
import {
  ConfigDevManager,
  ConfigManger,
  ConfigProdManager,
  ConfigTestManager,
} from "./config-manager";
import { Config } from "./interfaces/config-manager.interface";

@Injectable()
export class ConfigService {
  configManager: ConfigManger<Config>;

  constructor() {
    this.configManager = this.createConfigManager();
  }

  public get<K extends InnerKeys<Config>>(key: K): InnerValue<Config, K> {
    return this.configManager.get(key);
  }

  private createConfigManager() {
    switch (process.env.NODE_ENV) {
      case "development":
        return new ConfigDevManager<Config>();
      case "test":
        return new ConfigTestManager<Config>();
      case "production":
        return new ConfigProdManager<Config>();
      default:
        throw new Error("Unsupported NODE_ENV");
    }
  }
}
