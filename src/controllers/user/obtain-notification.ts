import { Request, Response } from 'express';
import Controller from '../../frameworks/controller';
import * as t from '../req-data-transformer';
import Service, { OutData } from '../../services/user/auth-refresher/auth-refresher';

export default class ObtainNotification implements Controller {
    private service = new Service();
    private inData = {} as {
        token: string;
    };
    private serviceOutData = {} as OutData;

    async handle(req: Request, res: Response) {
        await this.getDataFromReq(req);
        await this.obtainNewToken();

        this.sendRes(res);
    }

    private async getDataFromReq(req: Request) {
        this.inData.token = t.call(
            req,
            t.obtain('headers.authorization'),
            t.isRawToken('INVALID_AUTHORIZATION'),
            t.obtainToken(),
        ) as string;
    }

    private async obtainNewToken() {
        this.serviceOutData = await this.service.obtainNewToken(this.inData);
    }

    private async sendRes(res: Response) {
        res.status(200).send({
            token: this.serviceOutData.serviceData.auth.token,
            expiry_date: this.serviceOutData.serviceData.auth.expiryDate.toISOString(),
        });
    }
}
