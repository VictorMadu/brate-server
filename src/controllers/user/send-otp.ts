import { Request, Response } from 'express';
import Controller from '../../frameworks/controller';
import * as t from '../req-data-transformer';
import Service from '../../services/user/send-otp/service';

export default class SendOTP implements Controller {
    private inData = {} as {
        email: string;
    };
    private service = new Service();

    async handle(req: Request, res: Response) {
        await this.getDataFromReq(req);
        await this.sendOTP();

        this.sendRes(res);
    }

    private async getDataFromReq(req: Request) {
        this.inData.email = t.call(
            req,
            t.obtain('params.email'),
            t.isEmail('INVALID_EMAIL'),
        ) as string;
    }

    private async sendOTP() {
        return this.service.sendOTP(this.inData);
    }

    private async sendRes(res: Response) {
        res.status(204).end();
    }
}
