import { User } from '../Entities/User';
import { UserVerification } from '../Entities/UserVerification';

export default interface Mailer {
    sendVerificationMail(user: { email: string }, verification: { otp: string }): Promise<void>;
}
