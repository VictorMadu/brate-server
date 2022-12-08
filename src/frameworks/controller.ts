import { Request, Response } from 'express';
import { OrWithPromise } from 'ts-util-types';

export default interface Controller {
    handle(req: Request, res: Response): OrWithPromise<void>;
}

export interface ErrorController extends Controller {
    setError(error: unknown): this;
}
