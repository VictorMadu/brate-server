export interface GetAlertCommandRequest {
    onlyTriggered: boolean;
    onlyUnTriggered: boolean;
    market?: 'P' | 'B';
    pageCount: number;
    pageOffset: number;
    authToken: string;
    pairs: { base: string; quota: string }[];
    minCreatedAt?: Date;
    maxCreatedAt?: Date;
    minTriggeredAt?: Date;
    maxTriggeredAt?: Date;
}

// TODO: Use the iterator and async iterator pattern
export type GetAlertCommandResponse = {
    priceAlertId: string;
    userId: string;
    marketType: 'P' | 'B';
    base: string;
    quota: string;
    setRate: string;
    targetRate: string;
    createdAt: Date;
    triggeredAt: Date | null;
}[];
