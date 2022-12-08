import { Request, Response } from 'express';
import Controller from '../../frameworks/controller';
import * as t from '../req-data-transformer';
import Service from '../../services/user/sign-up/sign-up';

export default class SignUp implements Controller {
    private inData = {} as {
        name: string;
        email: string;
        phone: string;
        password: string;
    };
    private service = new Service();
    private userModel!: { id: string };

    async handle(req: Request, res: Response) {
        await this.getDataFromReq(req);
        await this.signUp();
        await this.sendRes(res);
    }

    private async getDataFromReq(req: Request) {
        this.inData.name = t.call(
            req,
            t.obtain('body.name'),
            t.isName('INVALID_NAME'),
            t.cleanName(),
        );
        this.inData.email = t.call(req, t.obtain('body.email'), t.isEmail('INVALID_EMAIL'));
        this.inData.phone = t.call(req, t.obtain('body.phone'), t.isPhone('INVALID_PHONE'));
        this.inData.password = t.call(
            req,
            t.obtain('body.password'),
            t.isString('INVALID_PASSWORD'),
            t.isLenRange({ min: 8 }, 'INVALID_PASSWORD'),
        );
    }

    private async signUp() {
        const { userModel } = await this.service.handle(this.inData);
        this.userModel = userModel;
    }

    private async sendRes(res: Response) {
        res.status(201).send({
            data: {
                user: {
                    id: this.userModel.id,
                },
            },
        });
    }
}
