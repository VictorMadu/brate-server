import { User } from '../../../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../../../Application/Common/Interfaces/Entities/UserVerification';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import UserVerificationRepository from '../../../Application/Common/Interfaces/Repositories/UserVerificationRepository';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import Mailer from '../../../Application/Common/Interfaces/Services/Mailer';
import { Nullable } from '../../../Application/Common/Interfaces/Types';
import { VerifyOTPCommandRequest } from './VerifyOTPCommand';
import * as UserVerificationError from '../../../Application/Common/Errors/Domain/Authentication';

export default class VerifyOTPManager {
    private user = {} as Pick<User, 'email' | 'userId' | 'isBank'>;
    private userVerification = {} as Pick<
        UserVerification,
        'verificationId' | 'otp' | 'hashedOTP' | 'createdAt' | 'noOfTries'
    > &
        Nullable<Pick<UserVerification, 'verifiedAt'>>;
    private otherData = {} as { isMatch: boolean };

    constructor(commandRequest: VerifyOTPCommandRequest) {
        this.createUserFromRequest(commandRequest);
    }

    async obtainVerificationForAuthentication(verificationRepository: UserVerificationRepository) {
        const verificationResult = await verificationRepository.findOne({
            filters: { email: this.user.email },
        });
        this.userVerification.verificationId = verificationResult.verificationId;
        this.userVerification.hashedOTP = verificationResult.hashedOTP;
        this.userVerification.createdAt = verificationResult.createdAt;
        this.userVerification.verifiedAt = verificationResult.verifiedAt;
        this.userVerification.noOfTries = verificationResult.noOfTries;
    }

    async populateIfMatches(hasher: HashManager) {
        console.log(
            'hasher.isMatchAsync',
            this.userVerification.otp,
            this.userVerification.hashedOTP,
        );
        this.otherData.isMatch = await hasher.isMatchAsync(
            this.userVerification.otp,
            this.userVerification.hashedOTP,
        );
    }

    async updateVerificationStatus(verificationRepository: UserVerificationRepository) {
        if (this.otherData.isMatch) {
            await Promise.all([
                verificationRepository.updateRetries({ user: this.user }),
                this.setVerified(verificationRepository),
            ]);
        } else {
            await verificationRepository.updateRetries({ user: this.user });
        }
    }

    async setVerified(verificationRepository: UserVerificationRepository) {
        const result = await verificationRepository.setVerified({ user: this.user });
        this.userVerification.verifiedAt = result.verifiedAt;
    }

    async obtainUserDetails(userRepository: UserRepository) {
        const findResult = await userRepository.findOne({ filter: { email: this.user.email } });
        this.user.userId = findResult.userId;
        this.user.isBank = findResult.isBank;
    }

    getUserData() {
        return this.user;
    }

    getUserVerificationData() {
        return this.userVerification;
    }

    private async createUserFromRequest(commandRequest: VerifyOTPCommandRequest) {
        this.user.email = commandRequest.email;
        this.userVerification.otp = commandRequest.otp;
    }
}
