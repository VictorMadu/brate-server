import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { InnerKeys } from "ts-util-types";
import { get } from "lodash";

export interface ConfigManger<
  T extends Record<string, any> = Record<string, any>
> {
  get(key: InnerKeys<T>): any;
}

abstract class ConfigManagerBase<
  T extends Record<string, any> = Record<string, any>
> implements ConfigManger<T> {
  private FILE_ENCODING: BufferEncoding = "utf-8";
  private config: Record<string, any> = {};
  protected abstract getFile(): string;

  constructor() {
    const loadedFile = this.readFile(this.getFile());
    this.config = yaml.load(loadedFile) as Record<string, any>;
  }

  private readFile(file: string) {
    return fs.readFileSync(this.getFilePath(file), {
      encoding: this.FILE_ENCODING,
    });
  }

  private getFilePath(file: string) {
    return path.join(process.cwd(), file);
  }

  get(key: InnerKeys<T>) {
    return get(this.config, key as string);
  }
}

export class ConfigTestManager<
  T extends Record<string, any> = Record<string, any>
> extends ConfigManagerBase<T> {
  getFile() {
    return "config.test.yaml";
  }
}

export class ConfigProdManager<
  T extends Record<string, any> = Record<string, any>
> extends ConfigManagerBase<T> {
  getFile() {
    return "config.yaml";
  }
}
