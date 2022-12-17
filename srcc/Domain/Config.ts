import * as dotenv from 'dotenv';
import _ from 'lodash';
import { InnerKeys, InnerValue } from 'ts-util-types';

dotenv.config();

export default class Config {
    get<K extends InnerKeys<typeof config>>(key: K) {
        return _.get(config, key) as unknown as InnerValue<typeof config, K>;
    }
}

const config = {
    port: +(<string>process.env.PORT),
    bcryptSaltRounds: +(<string>process.env.BCRYPT_SALT_ROUNDS),
    otp: {
        emailVerification: {
            length: +(<string>process.env.EMAIL_VERIFICATION_OTP_LENGTH),
        },
    },
    database: {
        erate: {
            postgres: {
                host: process.env.ERATE_POSTGRES_HOST as string,
                port: +(process.env.ERATE_POSTGRES_PORT as string),
                dbName: process.env.ERATE_POSTGRES_DBNAME as string,
                user: process.env.ERATE_POSTGRES_USER as string,
                pwd: process.env.ERATE_POSTGRES_PWD as string,
                poolSize: +(process.env.ERATE_POSTGRES_POOL_SIZE as string),
            },
        },
    },
    auth: {
        jwt: {
            secret: process.env.JWT_SECRET as string,
            maxLifeTime: obtainNumFromProductString(process.env.JWT_MAX_LIFETIME as string),
        },
    },
};

function obtainNumFromProductString(productString: string, initialValue = 1) {
    return productString
        .split('*')
        .map((s) => +s)
        .reduce((n, total) => (total *= n), initialValue);
}
