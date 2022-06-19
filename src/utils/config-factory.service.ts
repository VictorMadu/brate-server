import { Injectable } from 'nist-core/injectables';
import { InnerKeys, InnerValue } from 'ts-util-types';
import {
    ConfigDevManager,
    ConfigManger,
    ConfigProdManager,
    ConfigTestManager,
} from './config-manager';
import { Config } from './interfaces/config-manager.interface';

@Injectable()
export class ConfigService {
    AppConfigGetter: ConfigManger<Config>;

    constructor() {
        this.AppConfigGetter = this.createAppConfigGetter();
    }

    public get<K extends InnerKeys<Config>>(key: K): InnerValue<Config, K> {
        return this.AppConfigGetter.get(key);
    }

    private createConfigGetter() {
        switch (process.env.NODE_ENV) {
            case 'development':
                return new ConfigDevManager<Config>();
            case 'test':
                return new ConfigTestManager<Config>();
            case 'production':
                return new ConfigProdManager<Config>();
            default:
                throw new Error('Unsupported NODE_ENV');
        }
    }
}
