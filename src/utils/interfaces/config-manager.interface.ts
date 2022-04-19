// TODO: Add the commit and line ref to this in the documentation of the fix for `InnerKeys` in `ts-util-types`

export interface Config {
  app: {
    address: string;
    port: number;
  };
  jwt: {
    secretKey: string;
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
}
