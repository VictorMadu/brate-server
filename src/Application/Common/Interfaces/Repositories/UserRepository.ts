import { AtLeastOne } from 'ts-util-types';
import { User } from '../Entities/User';

export default interface UserRepository {
    insertOne(inData: {
        user: Pick<User, 'email' | 'name' | 'phone' | 'hashedPassword'>;
    }): Promise<Pick<User, 'userId' | 'createdAt'>>;

    findOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
    }): Promise<Pick<User, 'userId' | 'email' | 'name' | 'phone' | 'createdAt' | 'hashedPassword'>>;

    updateOne(inData: {
        filter: AtLeastOne<{ id: string; email: string }>;
        user: Partial<Pick<User, 'name' | 'phone'>>;
    }): Promise<boolean>;
}
