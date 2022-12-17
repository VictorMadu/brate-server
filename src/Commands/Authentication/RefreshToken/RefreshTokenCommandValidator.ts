import { Request } from '../../Common/Interfaces/Request';
import { RefreshTokenCommandRequest, RefreshTokenCommandResponse } from './RefreshTokenCommand';
import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class RefreshTokenCommandValidator
    implements CommandHandler<RefreshTokenCommandRequest, RefreshTokenCommandResponse>
{
    constructor(
        private decorated: CommandHandler<RefreshTokenCommandRequest, RefreshTokenCommandResponse>,
    ) {}

    handle(
        _commandRequest: Request<RefreshTokenCommandRequest>,
    ): Promise<RefreshTokenCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<RefreshTokenCommandRequest>,
    ): RefreshTokenCommandRequest {
        if (!_.isString(commandRequest.authToken)) {
            throw new ValidationError.InvalidToken();
        }

        return commandRequest as RefreshTokenCommandRequest;
    }
}
