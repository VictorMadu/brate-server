import User from '../../../../Domain/Aggregates/User';
import UserVerifcation from '../../../../Domain/Entities/UserVerification';
import AuthTokenManager from '../../../Common/Interfaces/AuthTokenManager';
import { Manager } from '../../../Common/Interfaces/Db/Manager';
import HashManager from '../../../Common/Interfaces/HashManager';
import UserRepository from '../../../Common/Interfaces/Repository/UserRepository';
import UserVerificationRepository from '../../../Common/Interfaces/Repository/UserVerificationRepository';
import { Request } from '../../../Common/Interfaces/Request';
import { LoginCommandRequest, LoginCommandResponse } from './LoginCommand';
import { LoginCommandValidator } from './LoginCommandValidator';

export default class LoginCommandHandler {
    private validator = new LoginCommandValidator();

    constructor(
        private userRepository: UserRepository,
        private verificationRepository: UserVerificationRepository,
        private authTokenManager: AuthTokenManager,
        private hasher: HashManager,
        private db: Manager,
    ) {}

    async handle(_commandRequest: Request<LoginCommandRequest>): Promise<LoginCommandResponse> {
        const commandRequest = this.validator.validate(_commandRequest);

        const user = User.create({ email: commandRequest.email });
        const verification = UserVerifcation.create({});

        this.db.manage(() => this.populateUserFromRepository(user));
        this.db.manage(() => () => this.populateVerificationFromRepository(user, verification));

        await user.isUserPassword(this.hasher, commandRequest.password);
        return this.getResponse(user, verification);
    }

    async populateUserFromRepository(user: User) {
        const findResult = await this.userRepository.findOne({ filter: { email: user.email } });

        user.userId = findResult.userId;
        user.email = findResult.email;
        user.name = findResult.name;
        user.phone = findResult.phone;
        user.createdAt = findResult.createdAt;
    }

    async populateVerificationFromRepository(user: User, verification: UserVerifcation) {
        const findResult = await this.verificationRepository.findOne({
            filters: { email: user.email },
        });

        verification.verificationId = findResult.verificationId;
        verification.hashedOTP = findResult.hashedOTP;
        verification.noOfTries = findResult.noOfTries;
        verification.createdAt = findResult.createdAt;
        verification.verifiedAt = findResult.verifiedAt;
    }

    getResponse(user: User, verification: UserVerifcation): LoginCommandResponse {
        const tokenGenerationResult = this.authTokenManager.generate({ user, verification });
        return {
            token: tokenGenerationResult.token,
            tokenExpiryAt: tokenGenerationResult.expiryDate,
            name: user.name,
            phone: user.phone,
            createdAt: user.createdAt.getDate() as Date,
            isVerified: !!verification.verifiedAt.getDate(),
        };
    }
}
