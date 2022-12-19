export interface GetAlertCommandRequest {
    pageCount: number;
    pageOffset: number;
    authToken: string;
    // TODO: Filter by pairs too
    baseCurrencyId?: number[];
    quotaCurrencyId?: number[];
    minCreatedAt?: Date;
    maxCreatedAt?: Date;
    minTriggeredAt?: Date;
    maxTriggeredAt?: Date;
    unTriggeredOnly?: boolean;
    triggeredOnly?: boolean;
    rateAlertIds?: string[];
}

// TODO: Use the iterator and async iterator pattern
export type GetAlertCommandResponse = {
    rateAlertId: string;
    baseCurrencyId: string;
    quotaCurrencyId: string;
    targetRate: number;
    createdAt: Date;
    triggeredAt: Date | null;
    observedUserId: string;
    observedUserName: string;
}[];
