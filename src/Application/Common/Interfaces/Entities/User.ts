export interface User {
    userId: string;
    verificationId: string;
    name: string;
    email: string;
    password: string;
    hashedPassword: string;
    phone: string;
    createdAt: Date;
    verifiedAt: Date;
    isBank: boolean;
}
