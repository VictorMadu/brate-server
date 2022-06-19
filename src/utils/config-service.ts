import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import get from "lodash/get";
import { Injectable } from "nist-core/injectables";
import { InnerKeys, InnerValue } from "ts-util-types";
import { Config } from "./interfaces/config-manager.interface";

@Injectable()
export class ConfigService {
  private static config = <Config>new ConfigService().loadConfig();

  constructor() {}

  get<K extends InnerKeys<Config>>(key: K): InnerValue<Config, K> {
    return get(ConfigService.config, key);
  }

  private loadConfig() {
    const configFile = this.readFile();
    return yaml.load(configFile) as Record<string, any>;
  }

  private readFile() {
    const filePath = this.getFilePath();

    return fs.readFileSync(filePath, {
      encoding: "utf-8",
    });
  }

  private getFilePath() {
    return path.join(process.cwd(), this.getFileName());
  }

  private getFileName() {
    switch (process.env.NODE_ENV) {
      case "development":
        return "config.dev.yaml";

      case "test":
        return "config.test.yaml";

      case "production":
        return "config.yaml";

      default:
        throw new Error("Unsupported NODE_ENV");
    }
  }
}
