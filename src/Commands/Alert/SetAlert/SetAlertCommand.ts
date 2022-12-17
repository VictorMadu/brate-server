export interface SetAlertCommandRequest {
    authToken: string;
    pairs: {
        base: string;
        quota: string;
        targetRate: string;
        marketType: 'P' | 'B';
    }[];
}

// TODO: Use the iterator and async iterator pattern
export type SetAlertCommandResponse = {
    priceAlertId: string;
}[];
