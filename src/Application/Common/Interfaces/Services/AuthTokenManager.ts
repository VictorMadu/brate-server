import { User } from '../Entities/User';
import { UserVerification } from '../Entities/UserVerification';
import { Nullable } from '../Types';

export default interface AuthTokenManager {
    generate(payloadData: PayloadData): TokenData;
    parse(token: TokenData['token']): PayloadData;
}

export interface PayloadData {
    user: Pick<User, 'userId' | 'isBank'>;
    verification: Nullable<Pick<UserVerification, 'verifiedAt'>>;
}

export interface TokenData {
    token: string;
    expiryDate: Date;
}
