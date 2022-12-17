export interface ProfileModificationCommandRequest {
    authToken: string;
    name?: string;
    phone?: string;
}

export interface ProfileModificationCommandResponse {
    name: string;
    phone: string;
}
