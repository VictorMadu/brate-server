export interface WithdrawCurrencyCommandRequest {
    authToken: string;
    currencyId: number;
    amountToWithdraw: string;
}

// TODO: Use the iterator and async iterator pattern
export type WithdrawCurrencyCommandResponse = {
    amountAvailable: string;
};
