export type SetAlertCommandRequest = {
    authToken: string;
    bank?: {
        bankUserId: string;
        baseCurrencyId: number;
        quotaCurrencyId: number;
        targetRate: string;
    };
    official?: { baseCurrencyId: number; quotaCurrencyId: number; targetRate: string };
};

export type SetAlertCommandResponse = {
    rateAlertId: string;
    baseCurrencyId: string;
    quotaCurrencyId: string;
    targetRate: number;
    createdAt: Date;
    triggeredAt: Date;
    observedUserId: string;
    observedUserName: string;
};
