import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import { RefreshTokenCommandRequest, RefreshTokenCommandResponse } from './RefreshTokenCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import RefreshTokenManager from './RefreshTokenManager';

export default class RefreshTokenCommandHandler
    implements CommandHandler<RefreshTokenCommandRequest, RefreshTokenCommandResponse>
{
    constructor(private authTokenManager: AuthTokenManager) {}

    async handle(commandRequest: RefreshTokenCommandRequest): Promise<RefreshTokenCommandResponse> {
        const refreshTokenManager = new RefreshTokenManager(commandRequest);

        refreshTokenManager.obtainUserAndVerificationDataFromAuthToken(this.authTokenManager);
        refreshTokenManager.generateNewAuthToken(this.authTokenManager);

        const authTokenData = refreshTokenManager.getAuthTokenData();

        return {
            token: authTokenData.token,
            tokenExpiryAt: authTokenData.expiryDate,
        };
    }
}
