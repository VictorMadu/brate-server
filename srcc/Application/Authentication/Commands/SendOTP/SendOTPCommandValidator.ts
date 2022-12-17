import { Request } from '../../../Common/Interfaces/Request';
import { SendOTPCommandRequest } from './SendOTPComand';
import validator from 'validator';
import _ from 'lodash';
import * as CommandErrors from '../../../Common/CommandErrors';

export class SendOTPCommandValidator {
    validate(commandRequest: Request<SendOTPCommandRequest>): SendOTPCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new CommandErrors.InvalidEmail();
        }
        return commandRequest as SendOTPCommandRequest;
    }
}
