import Profile from '../../../Application/Common/Errors/Domain/Profile';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import {
    ProfileModificationCommandRequest,
    ProfileModificationCommandResponse,
} from './ProfileModificationCommand';

export default class ProfileModificationManager {
    private user = {} as Pick<User, 'name' | 'phone' | 'userId'>;
    private isUpdateSuccessful: boolean = false;

    constructor(private commandRequest: ProfileModificationCommandRequest) {
        this.user.name = this.commandRequest.name as string;
        this.user.phone = this.commandRequest.phone as string;
    }

    async populateUserFromAuthManager(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.commandRequest.authToken);
        this.user.userId = tokenData.user.userId;
    }

    async updateUserOnPresistorAndResponse(userRepository: UserRepository) {
        this.isUpdateSuccessful = await userRepository.updateOne({
            filter: { id: this.user.userId },
            user: this.user,
        });
    }

    async assertUpdateWasSuccess() {
        if (!this.isUpdateSuccessful) throw new Profile.UpdateFailed();
    }

    getResponse(): ProfileModificationCommandResponse {
        return {
            name: this.user.name,
            phone: this.user.phone,
        };
    }
}
