import { User } from '../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../Application/Common/Interfaces/Entities/UserVerification';
import Mailer from '../Application/Common/Interfaces/Services/Mailer';

export default class GoogleMailer implements Mailer {
    async sendVerificationMail(
        user: { email: string },
        verification: { otp: string },
    ): Promise<void> {
        console.log('OTP', verification.otp);
        // throw new Error('Method not implemented.');
    }
}
