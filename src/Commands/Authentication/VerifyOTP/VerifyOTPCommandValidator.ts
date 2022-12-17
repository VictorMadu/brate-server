import { Request } from '../../Common/Interfaces/Request';
import { VerifyOTPCommandRequest, VerifyOTPCommandResponse } from './VerifyOTPCommand';
import validator from 'validator';
import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class VerifyOTPCommandValidator
    implements CommandHandler<VerifyOTPCommandRequest, VerifyOTPCommandResponse>
{
    constructor(
        private decorated: CommandHandler<VerifyOTPCommandRequest, VerifyOTPCommandResponse>,
    ) {}

    handle(_commandRequest: Request<VerifyOTPCommandRequest>): Promise<VerifyOTPCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(commandRequest: Request<VerifyOTPCommandRequest>): VerifyOTPCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new ValidationError.InvalidEmail();
        } else if (!_.isString(commandRequest.otp) && _.isNaN(+commandRequest.otp)) {
            throw new ValidationError.InvalidOTP();
        }

        return commandRequest as VerifyOTPCommandRequest;
    }
}
