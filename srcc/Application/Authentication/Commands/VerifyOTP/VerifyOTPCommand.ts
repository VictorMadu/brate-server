export interface VerifyOTPCommandRequest {
    email: string;
    otp: number;
}

export interface VerifyOTPCommandResponse {
    isVerified: boolean;
    noOfRetries: number;
    token: string;
    tokenExpiryDateTime: Date;
}
