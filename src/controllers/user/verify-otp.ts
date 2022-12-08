import { Request, Response } from 'express';
import { OrWithArray } from 'ts-util-types';
import Controller from '../../frameworks/controller';
import OTPVerification, { AuthData } from '../../services/user/otp-verification/otp-verification';
import * as t from '../req-data-transformer';

type ResData<Data extends Object> = { data: Data };

interface UserResData {
    user: {
        id: string;
        is_verified: boolean;
    };
}

interface AuthResData {
    auth: {
        token: string;
        expires_date: string;
    };
}

interface InData {
    email: string;
    otp: string;
    shouldIncludeToken: boolean;
}

interface ServiceData {
    userId: string;
    isVerified: boolean;
    authToken?: string;
}

export default class VerifyOTP implements Controller {
    private otpVerification = new OTPVerification();
    private inData = {} as InData;
    private resDataBuilder = new ResDataBuilder();

    async handle(req: Request, res: Response) {
        await this.getDataFromReq(req);
        return this.inData.shouldIncludeToken
            ? this.handleForIncludeToken(res)
            : this.handleForExcludeToken(res);
    }

    private async getDataFromReq(req: Request) {
        this.inData.email = t.call(req, t.obtain('params.email'), t.isEmail('INVALID_EMAIL'));
        this.inData.otp = t.call(req, t.obtain('body.otp'), t.isString('INVALID_OTP'));
        this.inData.shouldIncludeToken = t.call(
            req,
            t.obtain('include_token'),
            t.setDefault(false),
            t.isOptional(t.isBooleanLikeString, 'INVALID_INCLUDE_TOKEN'),
            t.obtainBooleanFromLikeString(),
        );
    }

    private async handleForIncludeToken(res: Response) {
        const serviceData = await this.otpVerification.handleAndAddAuthToken(this.inData);
        const resData = this.resDataBuilder.addBase(serviceData).addAuth(serviceData).build();

        res.status(200).send(resData);
    }

    private async handleForExcludeToken(res: Response) {
        const serviceData = await this.otpVerification.handle(this.inData);
        const resData = this.resDataBuilder.addBase(serviceData).build();

        res.status(200).send(resData);
    }
}

class ResDataBuilder {
    private resData = {} as ResData<UserResData & Partial<AuthResData>>;

    addBase(serviceData: ServiceData) {
        this.resData = {
            data: {
                user: {
                    id: serviceData.userId,
                    is_verified: serviceData.isVerified,
                },
            },
        };
        return this;
    }

    addAuth(authData: AuthData) {
        this.resData.data.auth = {
            token: authData.authToken,
            expires_date: authData.expiryDate.toISOString(),
        };

        return this;
    }

    build() {
        return this.resData;
    }
}
