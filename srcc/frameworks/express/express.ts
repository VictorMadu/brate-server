import express from 'express';
import Router from './router';

export default class Express {
    app = express();

    getRouter() {
        return new Router(this.app);
    }

    listen(port: number, cb: () => void) {
        this.app.listen(port, cb);
    }
}
