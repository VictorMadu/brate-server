import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    ProfileRetrievalCommandRequest,
    ProfileRetrievalCommandResponse,
} from './ProfileRetrievalCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import ProfileRetrievalManager from './ProfileRetrievalManager';

export default class ProfileRetrievalCommandHandler
    implements CommandHandler<ProfileRetrievalCommandRequest, ProfileRetrievalCommandResponse>
{
    constructor(
        private userRepository: UserRepository,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(
        commandRequest: ProfileRetrievalCommandRequest,
    ): Promise<ProfileRetrievalCommandResponse> {
        const profileRetrievalManager = new ProfileRetrievalManager(commandRequest);

        await profileRetrievalManager.populateUserFromAuthManager(this.authTokenManager);
        await profileRetrievalManager.updateUserOnPresistorAndResponse(this.userRepository);
        await profileRetrievalManager.assertUserExists();

        return profileRetrievalManager.getResponse();
    }
}
