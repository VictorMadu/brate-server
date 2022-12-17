import * as jwt from 'jsonwebtoken';
import Config from '../Application/Common/Config';
import { User } from '../Application/Common/Interfaces/Entities/User';
import { UserVerification } from '../Application/Common/Interfaces/Entities/UserVerification';
import AuthTokenManager, {
    PayloadData,
    TokenData,
} from '../Application/Common/Interfaces/Services/AuthTokenManager';
import Mailer from '../Application/Common/Interfaces/Services/Mailer';

export default class JWTAuthTokenManager implements AuthTokenManager {
    private jwtSecret: string;
    private maxLifeTime: number;

    constructor(config: Config) {
        this.jwtSecret = config.get('auth.jwt.secret');
        this.maxLifeTime = config.get('auth.jwt.maxLifeTime');
    }

    generate(payloadData: PayloadData): TokenData {
        const expiryTimeInSecs = this.getExpiryTimeInSeconds();

        const token = jwt.sign(
            {
                data: this.convertToInData(payloadData),
                exp: expiryTimeInSecs,
            },
            this.jwtSecret,
        );

        return {
            token,
            expiryDate: new Date(expiryTimeInSecs * 1000),
        };
    }

    parse(token: string): PayloadData {
        const { data, iat } = jwt.verify(token, this.jwtSecret) as { data: string; iat: any };
        return this.convertToJWTData(data);
    }

    private getExpiryTimeInSeconds() {
        return Math.floor(Date.now() / 1000) + this.maxLifeTime;
    }

    private convertToInData(payloadData: PayloadData) {
        return JSON.stringify({
            id: payloadData.user.userId,
            verified_at: payloadData.verification.verifiedAt,
            is_bank: payloadData.user.isBank,
        });
    }

    private convertToJWTData(inData: string): PayloadData {
        const parsedData = JSON.parse(inData) as {
            id: string;
            verified_at: string | null;
            is_bank: boolean;
        };

        return {
            user: {
                userId: parsedData.id,
                isBank: parsedData.is_bank,
            },
            verification: {
                verifiedAt:
                    parsedData.verified_at == null ? null : new Date(parsedData.verified_at),
            },
        };
    }
}
