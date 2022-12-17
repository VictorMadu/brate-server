import { Request } from '../../Common/Interfaces/Request';
import { SendOTPCommandRequest, SendOTPCommandResponse } from './SendOTPCommand';
import validator from 'validator';
import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class SendOTPCommandValidator
    implements CommandHandler<SendOTPCommandRequest, SendOTPCommandResponse>
{
    constructor(private decorated: CommandHandler<SendOTPCommandRequest, SendOTPCommandResponse>) {}

    handle(_commandRequest: Request<SendOTPCommandRequest>): Promise<SendOTPCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(commandRequest: Request<SendOTPCommandRequest>): SendOTPCommandRequest {
        if (!(_.isString(commandRequest.email) && validator.isEmail(commandRequest.email))) {
            throw new ValidationError.InvalidEmail();
        }
        return commandRequest as SendOTPCommandRequest;
    }
}
