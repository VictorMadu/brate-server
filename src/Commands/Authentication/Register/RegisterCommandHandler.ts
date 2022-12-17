import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import Mailer from '../../../Application/Common/Interfaces/Services/Mailer';
import NumPasswordGenerator from '../../../Application/Common/Interfaces/Services/NumPasswordGenerator';
import { RegisterCommandRequest, RegisterCommandResponse } from './RegisterCommand';
import UserRegistration from './UserRegistration';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';

export default class RegisterCommandHandler
    implements CommandHandler<RegisterCommandRequest, RegisterCommandResponse>
{
    constructor(
        private userRepository: UserRepository,
        private hasher: HashManager,
        private numPasswordGenerator: NumPasswordGenerator,
        private mailer: Mailer,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(commandRequest: RegisterCommandRequest): Promise<RegisterCommandResponse> {
        const userRegistration = new UserRegistration(commandRequest);
        await userRegistration.hashPassword(this.hasher);
        await userRegistration.generateOTP(this.numPasswordGenerator);
        await userRegistration.hashOTP(this.hasher);
        await userRegistration.save(this.userRepository);
        await userRegistration.sendVerificationMail(this.mailer);
        const userData = userRegistration.getUserData();
        const verificationData = userRegistration.getUserVerificationData();
        const tokenData = this.authTokenManager.generate({
            user: userData,
            verification: verificationData,
        });

        return {
            token: tokenData.token,
            tokenExpiryAt: tokenData.expiryDate,
            verifiedAt: verificationData.verifiedAt,
            createdAt: verificationData.createdAt,
            isBank: commandRequest.isBank,
            userId: userData.userId,
        };
    }
}
