import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import UserVerificationRepository from '../../../Application/Common/Interfaces/Repositories/UserVerificationRepository';
import HashManager from '../../../Application/Common/Interfaces/Services/HashManager';
import Mailer from '../../../Application/Common/Interfaces/Services/Mailer';
import NumPasswordGenerator from '../../../Application/Common/Interfaces/Services/NumPasswordGenerator';
import { SendOTPCommandRequest, SendOTPCommandResponse } from './SendOTPCommand';
import { DbManager } from '../../../Application/Common/Interfaces/Database/DbManager';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import UserOTPSender from './UserOTPSender';

export default class SendOTPCommandHandler
    implements CommandHandler<SendOTPCommandRequest, SendOTPCommandResponse>
{
    constructor(
        private verificationRepository: UserVerificationRepository,
        private hasher: HashManager,
        private numPasswordGenerator: NumPasswordGenerator,
        private mailer: Mailer,
    ) {}

    async handle(commandRequest: SendOTPCommandRequest): Promise<SendOTPCommandResponse> {
        const userOTPSender = new UserOTPSender(commandRequest);

        await userOTPSender.generateOTP(this.numPasswordGenerator);
        await userOTPSender.hashOTP(this.hasher);
        await userOTPSender.save(this.verificationRepository);
        await userOTPSender.sendVerificationMail(this.mailer);
    }
}
