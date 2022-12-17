import { Request } from '../../../Common/Interfaces/Request';
import validator from 'validator';
import _ from 'lodash';
import * as CommandErrors from '../../../Common/CommandErrors';
import { VerifyOTPCommandRequest } from './VerifyOTPCommand';

export class VerifyOTPCommandValidator {
    validate(commandRequest: Request<VerifyOTPCommandRequest>): VerifyOTPCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new CommandErrors.InvalidEmail();
        }
        if (!_.isNumber(commandRequest.otp) || _.isNaN(commandRequest.otp)) {
            throw new CommandErrors.InvalidOTP();
        }
        return commandRequest as VerifyOTPCommandRequest;
    }
}
