export interface UserVerification {
    verificationId: string;
    hashedOTP: string;
    otp: string;
    noOfTries: number;
    createdAt: Date;
    verifiedAt: Date;
}
