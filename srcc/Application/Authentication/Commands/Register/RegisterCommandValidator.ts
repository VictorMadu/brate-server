import { Request } from '../../../Common/Interfaces/Request';
import { RegisterCommandRequest } from './RegisterCommand';
import validator from 'validator';
import _ from 'lodash';
import * as CommandErrors from '../../../Common/CommandErrors';

export class RegisterCommandValidator {
    validate(commandRequest: Request<RegisterCommandRequest>): RegisterCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new CommandErrors.InvalidEmail();
        } else if (!_.isString(commandRequest.name)) {
            throw new CommandErrors.InvalidPassword();
        } else if (!_.isString(commandRequest.password)) {
            throw new CommandErrors.InvalidPhone();
        } else if (!_.isString(commandRequest.phone)) {
            throw new CommandErrors.InvalidPhone();
        }
        return commandRequest as RegisterCommandRequest;
    }
}
