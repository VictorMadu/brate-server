import { User } from '../../../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../../../Application/Common/Interfaces/Entities/UserVerification';
import UserVerificationRepository from '../../../Application/Common/Interfaces/Repositories/UserVerificationRepository';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import Mailer from '../../../Application/Common/Interfaces/Services/Mailer';
import NumPasswordGenerator from '../../../Application/Common/Interfaces/Services/NumPasswordGenerator';
import { Nullable } from '../../../Application/Common/Interfaces/Types';
import { SendOTPCommandRequest } from './SendOTPCommand';
import * as UserVerificationError from '../../../Application/Common/Errors/Domain/Authentication';

export default class UserOTPSender {
    private user = {} as Pick<User, 'email'>;
    private userVerification = {} as Pick<
        UserVerification,
        'verificationId' | 'otp' | 'hashedOTP' | 'createdAt'
    > &
        Nullable<Pick<UserVerification, 'verifiedAt'>>;

    constructor(commandRequest: SendOTPCommandRequest) {
        this.createUserFromRequest(commandRequest);
    }

    async generateOTP(numPasswordGenerator: NumPasswordGenerator) {
        this.userVerification.otp = numPasswordGenerator.generate(6);
    }

    async hashOTP(hasher: HashManager) {
        this.userVerification.hashedOTP = await hasher.hashAsync(this.userVerification.otp);
    }

    async save(verificationRepository: UserVerificationRepository) {
        await this.updateUserVerification(verificationRepository);
        this.assertUserVerified();
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

    private createUserFromRequest(commandRequest: SendOTPCommandRequest) {
        this.user.email = commandRequest.email;
    }

    private async updateUserVerification(verificationRepository: UserVerificationRepository) {
        const insertedVerification = await verificationRepository.saveNewOTP({
            user: this.user,
            verification: this.userVerification,
        });

        this.userVerification.verificationId = insertedVerification.verificationId;
        this.userVerification.createdAt = insertedVerification.createdAt;
        this.userVerification.verifiedAt = insertedVerification.verifiedAt;
    }

    private assertUserVerified() {
        if (this.userVerification.verificationId) return;
        throw new UserVerificationError.EmailNotExists();
    }
}
