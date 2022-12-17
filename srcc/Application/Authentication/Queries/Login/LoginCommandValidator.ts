import { Request } from '../../../Common/Interfaces/Request';
import validator from 'validator';
import _ from 'lodash';
import * as CommandErrors from '../../../Common/CommandErrors';
import { LoginCommandRequest } from './LoginCommand';

export class LoginCommandValidator {
    validate(commandRequest: Request<LoginCommandRequest>): LoginCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new CommandErrors.InvalidEmail();
        }
        if (!_.isString(commandRequest.password)) {
            throw new CommandErrors.InvalidPassword();
        }
        return commandRequest as LoginCommandRequest;
    }
}
