import UserRegistrationManager from './UserRegistrationManager';

export default interface UserManager {
    createForRegistration(): UserRegistrationManager;
}
