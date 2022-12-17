import { User } from '../../../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../../../Application/Common/Interfaces/Entities/UserVerification';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import Mailer from '../../../Application/Common/Interfaces/Services/Mailer';
import NumPasswordGenerator from '../../../Application/Common/Interfaces/Services/NumPasswordGenerator';
import { Nullable } from '../../../Application/Common/Interfaces/Types';
import { RegisterCommandRequest } from './RegisterCommand';

export default class UserRegistration {
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

    constructor(commandRequest: RegisterCommandRequest) {
        this.createUserFromRequest(commandRequest);
    }

    async hashPassword(hasher: HashManager) {
        this.user.hashedPassword = await hasher.hashAsync(this.user.password);
    }

    async generateOTP(numPasswordGenerator: NumPasswordGenerator) {
        this.userVerification.otp = numPasswordGenerator.generate(6);
    }

    async hashOTP(hasher: HashManager) {
        this.userVerification.hashedOTP = await hasher.hashAsync(this.userVerification.otp);
    }

    async save(userRepository: UserRepository) {
        const result = await userRepository.insertUserAndVerification({
            user: {
                ...this.user,
                ...this.userVerification,
            },
        });

        this.userVerification.createdAt = result.createdAt;
        this.userVerification.verifiedAt = result.verifiedAt;
        this.user.userId = result.userId;
        this.user.createdAt = result.createdAt;
    }

    // EVENTS
    async sendVerificationMail(mailer: Mailer) {
        mailer.sendVerificationMail(this.user, this.userVerification);
    }

    getUserData() {
        return this.user;
    }

    getUserVerificationData() {
        return this.userVerification;
    }

    private createUserFromRequest(commandRequest: RegisterCommandRequest) {
        this.user.name = commandRequest.name;
        this.user.email = commandRequest.email;
        this.user.password = commandRequest.password;
        this.user.phone = commandRequest.phone;
        this.user.isBank = commandRequest.isBank;
    }
}
