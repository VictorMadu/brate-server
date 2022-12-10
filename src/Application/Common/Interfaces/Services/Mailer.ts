import User from '../../../Domain/Aggregates/User';
import UserVerifcation from '../../../Domain/Entities/UserVerification';

export default interface Mailer {
    sendVerificationMail(user: User, verification: UserVerifcation): Promise<void>;
}
