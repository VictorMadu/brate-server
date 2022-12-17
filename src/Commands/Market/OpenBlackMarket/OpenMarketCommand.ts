export interface openBlackMarketCommandRequest {
    authToken: string;
    baseCurrencyId: number;
    quotaCurrencyId: number;
    rate: string;
}

// TODO: Use the iterator and async iterator pattern
export type openBlackMarketCommandResponse = {
    bankRateId: string;
};
