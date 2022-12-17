export interface FundCurrencyCommandRequest {
    authToken: string;
    currencyId: number;
    amountToFund: string;
}

// TODO: Use the iterator and async iterator pattern
export type FundCurrencyCommandResponse = {
    amountAvailable: string;
};
