import { Request } from '../../Common/Interfaces/Request';
import { RegisterCommandRequest, RegisterCommandResponse } from './RegisterCommand';
import validator from 'validator';
import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class RegisterCommandValidator
    implements CommandHandler<RegisterCommandRequest, RegisterCommandResponse>
{
    constructor(
        private decorated: CommandHandler<RegisterCommandRequest, RegisterCommandResponse>,
    ) {}

    handle(_commandRequest: Request<RegisterCommandRequest>): Promise<RegisterCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(commandRequest: Request<RegisterCommandRequest>): RegisterCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new ValidationError.InvalidEmail();
        } else if (!_.isString(commandRequest.name)) {
            throw new ValidationError.InvalidPassword();
        } else if (!_.isString(commandRequest.password)) {
            throw new ValidationError.InvalidPhone();
        } else if (!_.isString(commandRequest.phone)) {
            throw new ValidationError.InvalidPhone();
        } else if (!_.isBoolean(commandRequest.isBank)) {
            throw new ValidationError.InvalidIsBank();
        }

        return commandRequest as RegisterCommandRequest;
    }
}
