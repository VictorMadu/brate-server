import { UserModel } from "../users/user-repository";

export default interface TokenManager {
    generate(payloadData: PayloadData): TokenData;
    parse(tokenData: TokenData): PayloadData;
}

export interface PayloadData {
    userModel: Pick<UserModel, 'id'>;
    userVerificationModel: Pick<UserVerificationModel, 'verifiedAt'>;
}

export interface TokenData {
    token: string;
    expiryDate: Date;
}
