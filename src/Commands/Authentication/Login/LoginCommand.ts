export interface LoginCommandRequest {
    email: string;
    password: string;
}

export interface LoginCommandResponse {
    userId: string;
    email: string;
    name: string;
    phone: string;
    token: string;
    tokenExpiryAt: Date;
    createdAt: Date;
    verifiedAt: Date | null;
}
