import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    ProfileModificationCommandRequest,
    ProfileModificationCommandResponse,
} from './ProfileModificationCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import ProfileModificationManager from './ProfileModificationManager';

export default class ProfileModificationCommandHandler
    implements
        CommandHandler<ProfileModificationCommandRequest, ProfileModificationCommandResponse>
{
    constructor(
        private userRepository: UserRepository,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(
        commandRequest: ProfileModificationCommandRequest,
    ): Promise<ProfileModificationCommandResponse> {
        const profileModificationManager = new ProfileModificationManager(commandRequest);

        await profileModificationManager.populateUserFromAuthManager(this.authTokenManager);
        await profileModificationManager.updateUserOnPresistorAndResponse(this.userRepository);
        await profileModificationManager.assertUpdateWasSuccess();

        return profileModificationManager.getResponse();
    }
}
