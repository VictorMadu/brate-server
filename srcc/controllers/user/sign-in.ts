import { Request, Response } from 'express';
import Controller from '../../frameworks/controller';
import * as t from '../req-data-transformer';
import Service, { InData, OutData } from '../../services/user/sign-in/sign-in';
import { NullUserModel } from '../../services/user/sign-in/repository';

interface ResData {
    data: {
        user: {
            is_auth: boolean;
            is_verified: boolean;
            id: string;
        };
        auth: {
            token: string;
            expiry_date: string;
        };
    };
}

export default class SignIn implements Controller {
    private service = new Service();
    private inData = {} as InData;
    private serviceOutData = {} as OutData;

    async handle(req: Request, res: Response) {
        await this.getDataFromReq(req);
        await this.signIn();
        await this.sendRes(res);
    }

    private async getDataFromReq(req: Request) {
        this.inData.email = t.call(req, t.obtain('body.email'), t.isEmail('INVALID_EMAIL'));
        this.inData.password = t.call(
            req,
            t.obtain('body.password'),
            t.isString('INVALID_PASSWORD'),
            t.isLenRange({ min: 8 }, 'INVALID_PASSWORD'),
        );
    }

    private async signIn() {
        this.serviceOutData = await this.service.handle(this.inData);
    }

    private async sendRes(res: Response) {
        const resData = { data: {} } as ResData;

        if (this.serviceOutData.userModel instanceof NullUserModel) {
            return res.status(400).send({
                error: 'EMAIL_NOT_EXISTS',
            });
        }

        if (!this.serviceOutData.serviceData.isAuthed) {
            return res.status(400).send({
                error: 'WRONG_PASSWORD',
            });
        }

        resData.data.user = {
            is_auth: this.serviceOutData.serviceData.isAuthed,
            is_verified: this.serviceOutData.userVerificationModel != null,
            id: this.serviceOutData.userModel.id,
        };
        resData.data.auth = {
            token: this.serviceOutData.serviceData.auth.token,
            expiry_date: this.serviceOutData.serviceData.auth.expiryDate.toISOString(),
        };
        return res.status(200).send(resData);
    }
}
