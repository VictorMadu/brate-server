import { Request } from '../../Common/Interfaces/Request';
import {
    ProfileModificationCommandRequest,
    ProfileModificationCommandResponse,
} from './ProfileModificationCommand';
import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class ProfileModificationCommandValidator
    implements
        CommandHandler<ProfileModificationCommandRequest, ProfileModificationCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            ProfileModificationCommandRequest,
            ProfileModificationCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<ProfileModificationCommandRequest>,
    ): Promise<ProfileModificationCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<ProfileModificationCommandRequest>,
    ): ProfileModificationCommandRequest {
        if (!(_.isNull(commandRequest.name) || _.isString(commandRequest.name))) {
            throw new ValidationError.InvalidPassword();
        } else if (!(_.isNull(commandRequest.phone) || _.isString(commandRequest.phone))) {
            throw new ValidationError.InvalidPhone();
        }
        return commandRequest as ProfileModificationCommandRequest;
    }
}
