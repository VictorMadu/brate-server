export interface GetOfficialRatesCommandRequest {
    intervalInSecs: number;
    base: string;
    quota?: string[];
    minCreatedAt?: Date;
    maxCreatedAt: Date;
    historyLength: number;
}

// TODO: Use the iterator and async iterator pattern
export type GetOfficialRatesCommandResponse = {
    currencyId: number;
    rates: string[];
    createdAts: Date[];
    rowNos: number[];
}[];
