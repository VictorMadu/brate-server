export interface DeleteAlertCommandRequest {
    authToken: string;
    official?: {
        rateAlertId: string;
    };
    bank?: {
        rateAlertId: string;
    };
}

// TODO: Use the iterator and async iterator pattern
export type DeleteAlertCommandResponse = { isSuccessful: boolean };
