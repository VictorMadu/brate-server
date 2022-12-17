export interface Runner<Query extends unknown, Result extends any> {
    run(queryS: Query, ...values: any[]): Promise<Result>;
}
