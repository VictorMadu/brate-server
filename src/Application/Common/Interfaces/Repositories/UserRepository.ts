import { AtLeastOne } from 'ts-util-types';
import { User } from '../Entities/User';
import { UserVerification } from '../Entities/UserVerification';

export default interface UserRepository {
    insertUserAndVerification(inData: {
        user: Pick<User, 'email' | 'name' | 'phone' | 'hashedPassword' | 'isBank'> &
            Pick<UserVerification, 'hashedOTP'>;
    }): Promise<
        Pick<User, 'userId' | 'createdAt'> &
            Pick<UserVerification, 'verificationId'> & { verifiedAt: null }
    >;

    findOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
    }): Promise<
        Pick<
            User,
            'userId' | 'email' | 'name' | 'phone' | 'createdAt' | 'hashedPassword' | 'isBank'
        >
    >;

    updateOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
        user: Partial<Pick<User, 'name' | 'phone'>>;
    }): Promise<boolean>;

    getBankUserList(inData: {
        limit: number;
        offset: number;
    }): Promise<{ userId: string; name: string }[]>;
}
