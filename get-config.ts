import {
  ConfigManger,
  ConfigProdManager,
  ConfigTestManager,
} from "./config-manager";

export class ConfigFactory<
  T extends Record<string, any> = Record<string, any>
> {
  getInstance(): ConfigManger<T> {
    if (this.isTestOrDevEnvironment()) return new ConfigTestManager<T>();
    return new ConfigProdManager<T>();
  }

  isTestOrDevEnvironment() {
    return process.env.NODE_ENV === "test";
  }
}
