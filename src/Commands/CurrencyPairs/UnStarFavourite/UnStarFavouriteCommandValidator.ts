import { Request } from '../../Common/Interfaces/Request';
import {
    UnStarFavouriteCommandRequest,
    UnStarFavouriteCommandResponse,
} from './UnStarFavouriteCommand';

import _, { after } from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class CurrencyModificationCommandValidator
    implements CommandHandler<UnStarFavouriteCommandRequest, UnStarFavouriteCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            UnStarFavouriteCommandRequest,
            UnStarFavouriteCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<UnStarFavouriteCommandRequest>,
    ): Promise<UnStarFavouriteCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<UnStarFavouriteCommandRequest>,
    ): UnStarFavouriteCommandRequest {
        // TODO: Validate
        return commandRequest as UnStarFavouriteCommandRequest;
    }
}
