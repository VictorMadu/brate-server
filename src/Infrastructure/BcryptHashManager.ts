import HashManager from '../Application/Common/Interfaces/Services/HashManager';
import bcrypt from 'bcrypt';
import Config from '../Application/Common/Config';

export default class BcryptHashManager implements HashManager {
    constructor(private config: Config) {}

    async isMatchAsync(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    async hashAsync(password: string): Promise<string> {
        return bcrypt.hash(password, this.config.get('bcryptSaltRounds'));
    }
}
