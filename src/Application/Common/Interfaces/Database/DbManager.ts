export interface DbManager {
    manage(...funcs: (() => any)[]): Promise<void>;
}
