import { Request } from '../../Common/Interfaces/Request';
import { LoginCommandRequest, LoginCommandResponse } from './LoginCommand';
import validator from 'validator';
import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class LoginCommandValidator
    implements CommandHandler<LoginCommandRequest, LoginCommandResponse>
{
    constructor(private decorated: CommandHandler<LoginCommandRequest, LoginCommandResponse>) {}

    handle(_commandRequest: Request<LoginCommandRequest>): Promise<LoginCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(commandRequest: Request<LoginCommandRequest>): LoginCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new ValidationError.InvalidEmail();
        } else if (!_.isString(commandRequest.password)) {
            throw new ValidationError.InvalidPassword();
        }

        return commandRequest as LoginCommandRequest;
    }
}
