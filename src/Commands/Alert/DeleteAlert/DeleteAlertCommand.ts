export interface DeleteAlertCommandRequest {
    authToken: string;
    priceAlertIds: string[];
}

// TODO: Use the iterator and async iterator pattern
export type DeleteAlertCommandResponse = void;
