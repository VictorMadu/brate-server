import { Request } from '../../Common/Interfaces/Request';
import {
    ProfileRetrievalCommandRequest,
    ProfileRetrievalCommandResponse,
} from './ProfileRetrievalCommand';

import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class ProfileModificationCommandValidator
    implements CommandHandler<ProfileRetrievalCommandRequest, ProfileRetrievalCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            ProfileRetrievalCommandRequest,
            ProfileRetrievalCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<ProfileRetrievalCommandRequest>,
    ): Promise<ProfileRetrievalCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<ProfileRetrievalCommandRequest>,
    ): ProfileRetrievalCommandRequest {
        if (!_.isString(commandRequest.authToken)) {
            throw new ValidationError.InvalidToken();
        }
        return commandRequest as ProfileRetrievalCommandRequest;
    }
}
