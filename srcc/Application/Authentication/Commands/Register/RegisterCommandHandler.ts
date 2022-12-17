import { Request } from '../../../Common/Interfaces/Request';
import { RegisterCommandRequest, RegisterCommandResponse } from './RegisterCommand';
import { RegisterCommandValidator } from './RegisterCommandValidator';
import UserRepository from '../../../Common/Interfaces/Repository/UserRepository';
import User from '../../../../Domain/Aggregates/User';
import * as _ from 'lodash';
import { Manager } from '../../../Common/Interfaces/Db/Manager';
import UserVerifcation from '../../../../Domain/Entities/UserVerification';
import CurrentEntityDate from '../../../../Domain/ValueObjects/AppDates/CurrentDate';
import NullEntityDate from '../../../../Domain/ValueObjects/AppDates/null-date';
import HashManager from '../../../Common/Interfaces/HashManager';
import NumPasswordGenerator from '../../../Common/Interfaces/NumPasswordGenerator';
import UserVerificationRepository from '../../../Common/Interfaces/Repository/UserVerificationRepository';
import AuthTokenManager from '../../../Common/Interfaces/AuthTokenManager';
import Mailer from '../../../Common/Interfaces/Mailer';

export default class RegisterCommandHandler {
    private validator = new RegisterCommandValidator();

    constructor(
        private userRepository: UserRepository,
        private verificationRepository: UserVerificationRepository,
        private authTokenManager: AuthTokenManager,
        private hasher: HashManager,
        private numPasswordGenerator: NumPasswordGenerator,
        private mailer: Mailer,
        private db: Manager,
    ) {}

    async handle(
        _commandRequest: Request<RegisterCommandRequest>,
    ): Promise<RegisterCommandResponse> {
        const commandRequest = this.validator.validate(_commandRequest);

        const user = this.createUserFromRequest(commandRequest);
        const userVerification = this.createVerificationFromRequest(commandRequest);

        await user.hashPassword(this.hasher);

        userVerification.generateOTP(this.numPasswordGenerator);
        await userVerification.hashOTP(this.hasher);

        this.db.manage(
            () => this.saveAndUpdateUser(user),
            () => this.saveAndUpdateUserVerification(user, userVerification),
        );

        this.mailer.sendVerificationMail(user, userVerification);
        return this.getResponse(user, userVerification);
    }

    private createUserFromRequest(commandRequest: RegisterCommandRequest) {
        return User.create({
            name: commandRequest.name,
            email: commandRequest.email,
            password: commandRequest.password,
            phone: commandRequest.phone,
        });
    }

    private createVerificationFromRequest(commandRequest: RegisterCommandRequest) {
        return UserVerifcation.create({
            noOfTries: 0,
            createdAt: new CurrentEntityDate(),
            verifiedAt: new NullEntityDate(),
        });
    }

    private async saveAndUpdateUser(user: User) {
        const insertedUser = await this.userRepository.insertOne({ user });

        user.userId = insertedUser.userId;
        user.createdAt = insertedUser.createdAt;
    }

    private async saveAndUpdateUserVerification(user: User, verification: UserVerifcation) {
        const insertedVerification = await this.verificationRepository.insertOne({
            user,
            verification,
        });

        verification.verificationId = insertedVerification.verificationId;
        verification.createdAt = insertedVerification.createdAt;
        verification.verifiedAt = insertedVerification.verifiedAt;
    }

    private getResponse(user: User, verification: UserVerifcation): RegisterCommandResponse {
        const tokenGenerationResult = this.authTokenManager.generate({ user, verification });
        return {
            token: tokenGenerationResult.token,
            tokenExpiryAt: tokenGenerationResult.expiryDate,
            createdAt: user.createdAt.getDate() as Date,
            verifiedAt: verification.verifiedAt.getDate(),
        };
    }
}
