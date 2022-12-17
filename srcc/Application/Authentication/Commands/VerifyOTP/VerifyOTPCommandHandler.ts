import User from '../../../../Domain/Aggregates/User';
import UserVerifcation from '../../../../Domain/Entities/UserVerification';
import { Manager } from '../../../Common/Interfaces/Db/Manager';
import HashManager from '../../../Common/Interfaces/HashManager';
import NumPasswordGenerator from '../../../Common/Interfaces/NumPasswordGenerator';
import UserVerificationRepository from '../../../Common/Interfaces/Repository/UserVerificationRepository';
import { Request } from '../../../Common/Interfaces/Request';
import { VerifyOTPCommandRequest, VerifyOTPCommandResponse } from './VerifyOTPCommand';
import { VerifyOTPCommandValidator } from './VerifyOTPCommandValidator';
import * as CommandErrors from '../../../Common/CommandErrors';
import AuthTokenManager from '../../../Common/Interfaces/AuthTokenManager';

export default class SendOTPCommandHandler {
    private validator = new VerifyOTPCommandValidator();

    constructor(
        private verificationRepository: UserVerificationRepository,
        private hasher: HashManager,
        private authTokenManager: AuthTokenManager,
        private numPasswordGenerator: NumPasswordGenerator,
        private db: Manager,
    ) {}

    async handle(
        _commandRequest: Request<VerifyOTPCommandRequest>,
    ): Promise<VerifyOTPCommandResponse> {
        const commandRequest = this.validator.validate(_commandRequest);

        const user = User.create({ email: commandRequest.email });
        const verification = UserVerifcation.create({ otp: commandRequest.otp });

        verification.generateOTP(this.numPasswordGenerator);
        await verification.hashOTP(this.hasher);

        this.db.manage(() => this.populateVerificationFromRepository(user, verification));

        if (await this.isMatch(verification, commandRequest))
            return this.getResponse(user, verification);
        else throw new CommandErrors.OTPNotMatch();
    }

    async populateVerificationFromRepository(user: User, verification: UserVerifcation) {
        const findResult = await this.verificationRepository.saveNewOTP({
            user,
            verification,
        });

        verification.verificationId = findResult.verificationId;
        verification.noOfTries = findResult.noOfTries;
        verification.createdAt = findResult.createdAt;
        verification.verifiedAt = findResult.verifiedAt;
    }

    getResponse(user: User, verification: UserVerifcation): VerifyOTPCommandResponse {
        const tokenGenerationResult = this.authTokenManager.generate({ user, verification });
        return {
            isVerified: verification.verifiedAt.getDate() != null,
            noOfRetries: verification.noOfTries,
            token: tokenGenerationResult.token,
            tokenExpiryDateTime: tokenGenerationResult.expiryDate,
        };
    }

    async isMatch(verification: UserVerifcation, commandRequest: VerifyOTPCommandRequest) {
        return await verification.isVerificationOTP(this.hasher, commandRequest.otp.toString());
    }
}
