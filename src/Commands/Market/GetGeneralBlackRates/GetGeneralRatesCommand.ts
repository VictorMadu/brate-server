export interface GetGeneralRatesCommandRequest {
    intervalInSecs: number;
    userIds?: string[];
    base?: string;
    quota?: string;
    minRate?: number;
    maxRate?: number;
    minCreatedAt?: number;
    maxCreatedAt?: number;
    limitPrePair: number;
    totalLimit: number;
}

// TODO: Use the iterator and async iterator pattern
export type GetGeneralRatesCommandResponse = {
    base: string;
    quota: string;
    rates: string[];
    createdAts: Date[];
}[];
