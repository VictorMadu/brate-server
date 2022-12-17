export interface ExchangeCommandRequest {
    authToken: string;
    blackTradeId: string;
}

// TODO: Use the iterator and async iterator pattern
export type ExchangeCommandResponse = {
    tradeId: string;
};
