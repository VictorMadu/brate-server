import { InnerKeys } from "ts-util-types";
import { Config } from "./config-manager.interface";

export type PostgresKeys<K extends string, T extends unknown = InnerKeys<Config>> = 
T extends InnerKeys<Config> ? 
  T extends `postgres.clients.${string}.${K}` ? 
    T 
    : 
    never
  :
  never;
