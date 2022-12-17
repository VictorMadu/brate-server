export interface LoginCommandRequest {
    email: string;
    password: string;
}

export type LoginCommandResponse = {
    token: string;
    tokenExpiryAt: Date;
    name: string;
    phone: string;
    isVerified: boolean;
    createdAt: Date;
};
