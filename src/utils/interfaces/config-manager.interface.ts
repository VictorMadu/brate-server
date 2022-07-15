// TODO: Add the commit and line ref to this in the documentation of the fix for `InnerKeys` in `ts-util-types`

export interface Config {
    app: {
        host: string;
        port: number;
        cors: string[];
        https: Record<"keyFilePath" | "certFilePath", string> | null;
    };
    jwt: {
        secretKey: string;
        expiryAfter: number;
    };
    postgres: {
        host: string;
        port: number;
        database: string;
        clients: {
            currency: {
                username: string;
                password: string;
                pool_size: number;
            };
        };
    };
    bcrypt: {
        saltRounds: number;
    };

    currency_rate: {
        url: string;
        api_keys: string[];
    };
}
