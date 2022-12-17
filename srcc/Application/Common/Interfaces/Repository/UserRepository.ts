import { AtLeastOne } from 'ts-util-types';
import User from '../../../../Domain/Aggregates/User';

export default interface UserRepository {
    insertOne(inData: {
        user: Omit<User, 'userId' | 'createdAt'>;
    }): Promise<Pick<User, 'userId' | 'createdAt'>>;

    findOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
    }): Promise<Pick<User, 'userId' | 'email' | 'name' | 'phone' | 'createdAt' | 'hashPassword'>>;

    updateOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
        user: Partial<Pick<User, 'name' | 'phone'>>;
    }): Promise<boolean>;
}
