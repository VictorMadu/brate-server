export interface ObtainDetailsCurrencyCommandRequest {
    authToken: string;
    currencyIds?: number[];

    historySize: number;
}

// TODO: Use the iterator and async iterator pattern
export type ObtainDetailsCurrencyCommandResponse = {
    currencyId: string;
    transactionIds: string[];
    amounts: string[];
    levels: number[];
    createdAts: Date[];
}[];
