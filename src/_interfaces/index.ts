export type ResSend = <T extends unknown>(code: number, payload: T) => void;

export type ResTuple<T extends any> = [number, string, T];
