import User from '../../../../Domain/Aggregates/User';
import UserVerifcation from '../../../../Domain/Entities/UserVerification';
import { Manager } from '../../../Common/Interfaces/Db/Manager';
import HashManager from '../../../Common/Interfaces/HashManager';
import Mailer from '../../../Common/Interfaces/Mailer';
import NumPasswordGenerator from '../../../Common/Interfaces/NumPasswordGenerator';
import UserVerificationRepository from '../../../Common/Interfaces/Repository/UserVerificationRepository';
import { Request } from '../../../Common/Interfaces/Request';
import { SendOTPCommandRequest, SendOTPCommandResponse } from './SendOTPComand';
import { SendOTPCommandValidator } from './SendOTPCommandValidator';

export default class SendOTPCommandHandler {
    private validator = new SendOTPCommandValidator();

    constructor(
        private verificationRepository: UserVerificationRepository,
        private hasher: HashManager,
        private numPasswordGenerator: NumPasswordGenerator,
        private mailer: Mailer,
        private db: Manager,
    ) {}

    async handle(_commandRequest: Request<SendOTPCommandRequest>): Promise<SendOTPCommandResponse> {
        const commandRequest = this.validator.validate(_commandRequest);

        const user = User.create({ email: commandRequest.email });
        const verification = UserVerifcation.create({});

        verification.generateOTP(this.numPasswordGenerator);
        await verification.hashOTP(this.hasher);

        this.db.manage(() =>
            this.verificationRepository.saveNewOTP({
                user,
                verification,
            }),
        );

        this.mailer.sendVerificationMail(user, verification);
    }
}
