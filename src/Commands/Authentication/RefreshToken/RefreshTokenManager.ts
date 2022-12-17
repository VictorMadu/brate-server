import { User } from '../../../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../../../Application/Common/Interfaces/Entities/UserVerification';
import { Nullable } from '../../../Application/Common/Interfaces/Types';
import { RefreshTokenCommandRequest } from './RefreshTokenCommand';
import * as AuthenticationError from '../../../Application/Common/Errors/Domain/Authentication';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import { TokenData } from '../../../services/auth/token-manager';

export default class RefreshTokenManager {
    private user = {} as Pick<User, 'userId'>;
    private verification = {} as Nullable<Pick<UserVerification, 'verifiedAt'>>;
    private tokenData = {} as TokenData;
    private token: string = '';

    constructor(commandRequest: RefreshTokenCommandRequest) {
        this.createUserFromRequest(commandRequest);
    }

    async obtainUserAndVerificationDataFromAuthToken(authTokenManager: AuthTokenManager) {
        const tokenData = authTokenManager.parse(this.token);
        this.user.userId = tokenData.user.userId;
        this.verification.verifiedAt = tokenData.verification.verifiedAt;
    }

    async generateNewAuthToken(authTokenManager: AuthTokenManager) {
        this.tokenData = authTokenManager.generate({
            user: this.user,
            verification: this.verification,
        });
    }

    getUserData() {
        return this.user;
    }

    getUserVerificationData() {
        return this.verification;
    }

    getAuthTokenData() {
        return this.tokenData;
    }

    private async createUserFromRequest(commandRequest: RefreshTokenCommandRequest) {
        this.token = commandRequest.authToken;
    }
}
