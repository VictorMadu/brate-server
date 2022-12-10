import { AtLeastOne } from 'ts-util-types';
import { User } from '../Entities/User';
import { UserVerification } from '../Entities/UserVerification';

export default interface UserVerificationRepository {
    insertOne(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
        verification: Pick<UserVerification, 'hashedOTP'>;
    }): Promise<Pick<UserVerification, 'createdAt' | 'verifiedAt' | 'verificationId'>>;

    findOne(inData: {
        filters: AtLeastOne<{ userId: string; email: string }>;
    }): Promise<
        Pick<
            UserVerification,
            'verificationId' | 'hashedOTP' | 'noOfTries' | 'createdAt' | 'verifiedAt'
        >
    >;

    saveNewOTP(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
        verification: Pick<UserVerification, 'hashedOTP' | 'createdAt' | 'verifiedAt'>;
    }): Promise<
        Pick<UserVerification, 'verificationId' | 'noOfTries' | 'createdAt' | 'verifiedAt'>
    >;

    updateRetries(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
    }): Promise<
        Pick<UserVerification, 'verificationId' | 'noOfTries' | 'createdAt' | 'verifiedAt'>
    >;
}
