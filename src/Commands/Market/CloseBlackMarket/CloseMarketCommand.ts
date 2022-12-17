export interface CloseBlackMarketCommandRequest {
    authToken: string;
    baseCurrencyId: number;
    quotaCurrencyId: number;
}

// TODO: Use the iterator and async iterator pattern
export type CloseBlackMarketCommandResponse = {
    bankRateId: string;
};
