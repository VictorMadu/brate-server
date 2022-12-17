export interface GetSpecificBlackRatesCommandRequest {
    intervalInSecs: number;
    userIds?: string[];
    bankRateIds?: string[];
    baseIds?: number[];
    quotaIds?: number[];
    minRate?: string;
    maxRate?: string;
    minCreatedAt?: Date;
    maxCreatedAt?: Date;
    totalLimit: number;
    historyMaxSize: number;
}

// TODO: Use the iterator and async iterator pattern
export type GetSpecificBlackRatesCommandResponse = {
    bankRateId: string;
    userId: string;
    bankName: string;
    baseId: number;
    quotaId: number;
    rowNos: number[];
    rates: number[];
    createdAts: Date[];
}[];
