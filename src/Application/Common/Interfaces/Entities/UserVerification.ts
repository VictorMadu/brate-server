export interface UserVerification {
    verificationId: string;
    hashedOTP: string;
    otp: number;
    noOfTries: number;
    createdAt: Date;
    verifiedAt: Date;
}
