import express, { Express, Request, Response } from 'express';
import * as AppError from '../../error';
import { Method } from '../../http/method';
import { logExecutionTime } from '../../log-execution-time';
import Controller from '../controller';
import Router from '../router';

export default class ExpressRouter implements Router {
    constructor(private app: Express) {
        app.use(express.json());
    }

    add(path: string, method: Method, controller: Controller) {
        const methodName = this.getMethodName(method);

        this.app[methodName](path, async (req: Request, res: Response) => {
            console.log('\n\n ====================== REQUEST ==============================');
            console.log('Path =>', path);
            console.log('Method =>', method);

            await logExecutionTime(() => this.handle(controller, req, res), 'Total Time spent =>');
        });
    }

    private async handle(controller: Controller, req: Request, res: Response) {
        try {
            await controller.handle(req, res);
        } catch (error) {
            this.handleErrorFromController(error, res);
        }
    }

    private getMethodName(method: Method) {
        switch (method) {
            case Method.GET:
                return 'get';
            case Method.POST:
                return 'post';
            case Method.PUT:
                return 'put';
            case Method.DELETE:
                return 'delete';
            case Method.HEAD:
                return 'head';
            case Method.OPTIONS:
                return 'options';

            default:
                throw new Error('Unsupported method');
        }
    }

    private handleErrorFromController(error: unknown, res: Response) {
        console.log('handleErrorFromController', error);
        if (error instanceof AppError.Validation || error instanceof AppError.Database) {
            res.status(400).send({
                error: error.message,
            });
        } else {
            res.status(500).send({
                error: 'UNKNOWN',
            });
        }
    }
}
