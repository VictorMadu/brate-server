export interface Manager {
    manage(...funcs: (() => any)[]): Promise<void>;
}
