import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import UserVerificationRepository from '../../../Application/Common/Interfaces/Repositories/UserVerificationRepository';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import { VerifyOTPCommandRequest, VerifyOTPCommandResponse } from './VerifyOTPCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import VerifyOTPManager from './VerifyOTPManager';

export default class VerifyOTPCommandHandler
    implements CommandHandler<VerifyOTPCommandRequest, VerifyOTPCommandResponse>
{
    constructor(
        private userRepository: UserRepository,
        private verificationRepository: UserVerificationRepository,
        private hasher: HashManager,
        private authTokenManager: AuthTokenManager,
    ) {}

    async handle(commandRequest: VerifyOTPCommandRequest): Promise<VerifyOTPCommandResponse> {
        const verifyOTPManager = new VerifyOTPManager(commandRequest);

        console.log('CHECKPOINT1');
        await verifyOTPManager.obtainVerificationForAuthentication(this.verificationRepository);
        console.log('CHECKPOINT2');
        await verifyOTPManager.populateIfMatches(this.hasher);
        console.log('CHECKPOINT3');
        await verifyOTPManager.updateVerificationStatus(this.verificationRepository);
        console.log('CHECKPOINT4');
        await verifyOTPManager.obtainUserDetails(this.userRepository);
        console.log('CHECKPOINT5');

        const userData = verifyOTPManager.getUserData();
        const verificationData = verifyOTPManager.getUserVerificationData();

        const tokenData = this.authTokenManager.generate({
            user: userData,
            verification: verificationData,
        });

        return {
            token: tokenData.token,
            tokenExpiryAt: tokenData.expiryDate,
            verifiedAt: verificationData.verifiedAt,
            createdAt: verificationData.createdAt,
            userId: userData.userId,
        };
    }
}
