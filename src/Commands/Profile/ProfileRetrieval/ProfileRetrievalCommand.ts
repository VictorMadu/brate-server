export interface ProfileRetrievalCommandRequest {
    authToken: string;
}

export interface ProfileRetrievalCommandResponse {
    name: string;
    email: string;
    phone: string;
}
