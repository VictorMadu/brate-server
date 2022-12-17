import { AtLeastOne } from 'ts-util-types';
import User from '../../../../Domain/Aggregates/User';
import UserVerifcation from '../../../../Domain/Entities/UserVerification';

export default interface UserVerificationRepository {
    insertOne(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
        verification: Pick<UserVerifcation, 'hashedOTP' | 'noOfTries' | 'createdAt' | 'verifiedAt'>;
    }): Promise<Pick<UserVerifcation, 'createdAt' | 'verifiedAt' | 'verificationId'>>;

    findOne(inData: {
        filters: AtLeastOne<{ userId: string; email: string }>;
    }): Promise<
        Pick<
            UserVerifcation,
            'verificationId' | 'hashedOTP' | 'noOfTries' | 'createdAt' | 'verifiedAt'
        >
    >;

    saveNewOTP(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
        verification: Pick<UserVerifcation, 'hashedOTP' | 'createdAt' | 'verifiedAt'>;
    }): Promise<Pick<UserVerifcation, 'verificationId' | 'noOfTries' | 'createdAt' | 'verifiedAt'>>;

    updateRetries(inData: {
        user: AtLeastOne<Pick<User, 'userId' | 'email'>>;
    }): Promise<Pick<UserVerifcation, 'verificationId' | 'noOfTries' | 'createdAt' | 'verifiedAt'>>;
}
