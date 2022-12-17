import Profile from '../../../Application/Common/Errors/Domain/Profile';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import {
    ProfileRetrievalCommandRequest,
    ProfileRetrievalCommandResponse,
} from './ProfileRetrievalCommand';

export default class ProfileRetrievalManager {
    private user = {} as Pick<User, 'name' | 'phone' | 'userId' | 'email'>;

    constructor(private commandRequest: ProfileRetrievalCommandRequest) {}

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updateUserOnPresistorAndResponse(userRepository: UserRepository) {
        const findResult = await userRepository.findOne({ filter: { id: this.user.userId } });
        this.user.userId = findResult.userId;
        this.user.email = findResult.email;
        this.user.name = findResult.name;
        this.user.phone = findResult.phone;
    }

    async assertUserExists() {
        if (this.user.userId == null) throw new Profile.NotExists();
    }

    getResponse(): ProfileRetrievalCommandResponse {
        return {
            name: this.user.name,
            email: this.user.email,
            phone: this.user.phone,
        };
    }
}
