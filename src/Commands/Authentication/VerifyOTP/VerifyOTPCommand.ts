export interface VerifyOTPCommandRequest {
    email: string;
    otp: string;
}

export interface VerifyOTPCommandResponse {
    userId: string;
    token: string;
    tokenExpiryAt: Date;
    createdAt: Date;
    verifiedAt: Date | null;
}
