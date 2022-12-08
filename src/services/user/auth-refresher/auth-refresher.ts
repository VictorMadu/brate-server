import _ from 'lodash';
import Auth from '../../auth/jwt-token-manager';

export interface InData {
    token: string;
}

export interface ServiceData {
    auth: {
        token: string;
        expiryDate: Date;
    };
}

export interface OutData {
    serviceData: ServiceData;
}

export default class AuthRefresher {
    private auth = new Auth();

    async obtainNewToken(inData: InData): Promise<OutData> {
        const authData = this.auth.obtainFromToken(inData);
        const tokenData = this.auth.generateToken(authData);

        return { serviceData: { auth: tokenData } };
    }
}
