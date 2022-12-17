export interface RegisterCommandRequest {
    email: string;
    name: string;
    phone: string;
    password: string;
}

export interface RegisterCommandResponse {
    token: string;
    tokenExpiryAt: Date;
    createdAt: Date;
    verifiedAt: Date | null;
}
