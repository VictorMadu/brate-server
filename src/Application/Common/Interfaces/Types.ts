export type Nullable<T extends Object> = { [K in keyof T]: T[K] | null };
