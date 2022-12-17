import { User } from '../../../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../../../Application/Common/Interfaces/Entities/UserVerification';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import UserVerificationRepository from '../../../Application/Common/Interfaces/Repositories/UserVerificationRepository';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import { Nullable } from '../../../Application/Common/Interfaces/Types';
import { LoginCommandRequest } from './LoginCommand';
import * as AuthenticationError from '../../../Application/Common/Errors/Domain/Authentication';

export default class LoginManager {
    private user = {} as Pick<
        User,
        | 'email'
        | 'name'
        | 'password'
        | 'phone'
        | 'hashedPassword'
        | 'userId'
        | 'createdAt'
        | 'isBank'
    >;
    private userVerification = {} as Pick<
        UserVerification,
        'verificationId' | 'otp' | 'hashedOTP' | 'createdAt'
    > &
        Nullable<Pick<UserVerification, 'verifiedAt'>>;

    constructor(commandRequest: LoginCommandRequest) {
        this.createUserFromRequest(commandRequest);
    }

    async obtainUserAndVerificationFromPresistor(
        userRepository: UserRepository,
        verificationRepository: UserVerificationRepository,
    ) {
        await this.obtainUserDataFromPresistor(userRepository);
        await this.obtainVerificationDataFromPresistor(verificationRepository);
    }

    async assertPasswordMatches(hasher: HashManager) {
        const isMatch = await hasher.isMatchAsync(this.user.password, this.user.hashedPassword);
        if (!isMatch) throw new AuthenticationError.PasswordNotMatch();
    }

    async assertUserVerified() {
        if (this.userVerification.verifiedAt == null) throw new AuthenticationError.NotVerified();
    }

    private async obtainUserDataFromPresistor(userRepository: UserRepository) {
        const findResult = await userRepository.findOne({ filter: { email: this.user.email } });

        this.user.name = findResult.name;
        this.user.isBank = findResult.isBank;
        this.user.phone = findResult.phone;
        this.user.hashedPassword = findResult.hashedPassword;
        this.user.userId = findResult.userId;
        this.user.createdAt = findResult.createdAt;
    }

    private async obtainVerificationDataFromPresistor(
        verificationRepository: UserVerificationRepository,
    ) {
        const findResult = await verificationRepository.findOne({
            filters: { userId: this.user.userId },
        });

        this.userVerification.verificationId = findResult.verificationId;
        this.userVerification.hashedOTP = findResult.hashedOTP;
        this.userVerification.createdAt = findResult.createdAt;
        this.userVerification.verifiedAt = findResult.verifiedAt;
    }

    getUserData() {
        return this.user;
    }

    getUserVerificationData() {
        return this.userVerification;
    }

    private async createUserFromRequest(commandRequest: LoginCommandRequest) {
        this.user.email = commandRequest.email;
        this.user.password = commandRequest.password;
    }
}
