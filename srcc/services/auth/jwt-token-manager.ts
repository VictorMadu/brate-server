import * as jwt from 'jsonwebtoken';
import Config from '../../config';
import TokenManager, { PayloadData, TokenData } from './token-manager';

export default class JWTTokenManager implements TokenManager {
    private static config = new Config();
    private static secret = JWTTokenManager.config.get('auth.jwt.secret');
    private static maxLifeTime = JWTTokenManager.config.get('auth.jwt.maxLifeTime');

    generate(payloadData: PayloadData): TokenData {
        const expiryTime = this.getExpiryTime();
        const expiryDate = new Date(expiryTime * 1000);

        const token = jwt.sign(
            {
                data: JSON.stringify(this.convertToInData(data)),
                exp: this.getExpiryTime(),
            },
            AuthService.secret,
        );

        return {
            token,
            expiryDate,
        };
    }
    parse(tokenData: TokenData): PayloadData {
        throw new Error('Method not implemented.');
    }

    generateToken(data: JWTData) {
        const expiryTime = this.getExpiryTime();
        const expiryDate = new Date(expiryTime * 1000);

        const token = jwt.sign(
            {
                data: JSON.stringify(this.convertToInData(data)),
                exp: this.getExpiryTime(),
            },
            AuthService.secret,
        );

        return {
            token,
            expiryDate,
        };
    }

    getExpiryTime() {
        return Math.floor(Date.now() / 1000) + AuthService.maxLifeTime;
    }

    obtainFromToken({ token }: { token: string }) {
        const { data } = jwt.verify(token, AuthService.secret) as { data: InData };
        return this.convertToJWTData(data);
    }

    private convertToInData(payloadData: PayloadData) {
        return {
            id: payloadData.userModel.id,
            verified_at: payloadData.userVerificationModel.verifiedAt.,
        };
    }

    private convertToJWTData(inData: InData) {
        return {
            userModel: {
                id: inData.id,
            },
            userVerificationModel: {
                verifiedAt: inData.verified_at,
            },
        };
    }
}
