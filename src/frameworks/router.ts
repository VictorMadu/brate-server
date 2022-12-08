import { Method } from '../http/method';
import Controller, { ErrorController } from '../frameworks/controller';

export default interface Router {
    add(path: string, method: Method, controller: Controller): void;
}
