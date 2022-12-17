import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import UserVerificationRepository from '../../../Application/Common/Interfaces/Repositories/UserVerificationRepository';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import Mailer from '../../../Application/Common/Interfaces/Services/Mailer';
import NumPasswordGenerator from '../../../Application/Common/Interfaces/Services/NumPasswordGenerator';
import { LoginCommandRequest, LoginCommandResponse } from './LoginCommand';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import UserRegistration from './LoginManager';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import LoginManager from './LoginManager';

export default class LoginCommandHandler
    implements CommandHandler<LoginCommandRequest, LoginCommandResponse>
{
    constructor(
        private userRepository: UserRepository,
        private verificationRepository: UserVerificationRepository,
        private hasher: HashManager,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(commandRequest: LoginCommandRequest): Promise<LoginCommandResponse> {
        const loginManager = new LoginManager(commandRequest);

        await loginManager.obtainUserAndVerificationFromPresistor(
            this.userRepository,
            this.verificationRepository,
        );
        await loginManager.assertPasswordMatches(this.hasher);
        await loginManager.assertUserVerified();

        const userData = loginManager.getUserData();
        const verificationData = loginManager.getUserVerificationData();

        const tokenData = this.authTokenManager.generate({
            user: userData,
            verification: verificationData,
        });

        return {
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            token: tokenData.token,
            tokenExpiryAt: tokenData.expiryDate,
            createdAt: verificationData.createdAt,
            verifiedAt: verificationData.verifiedAt,
            userId: userData.userId,
        };
    }
}
