import User from '../../../Domain/Aggregates/User';
import UserVerifcation from '../../../Domain/Entities/UserVerification';

export default interface AuthTokenManager {
    generate(payloadData: PayloadData): TokenData;
    parse(tokenData: TokenData): PayloadData;
}

export interface PayloadData {
    user: Pick<User, 'userId'>;
    verification: Pick<UserVerifcation, 'verifiedAt'>;
}

export interface TokenData {
    token: string;
    expiryDate: Date;
}
