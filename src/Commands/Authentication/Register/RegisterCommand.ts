export interface RegisterCommandRequest {
    email: string;
    name: string;
    phone: string;
    password: string;
    isBank: boolean;
}

export interface RegisterCommandResponse {
    userId: string;
    isBank: boolean;
    token: string;
    tokenExpiryAt: Date;
    createdAt: Date;
    verifiedAt: Date | null;
}
